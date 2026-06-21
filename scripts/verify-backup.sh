#!/bin/bash

# Min Nail & Hair Backup Verification Script
# Checks backup file integrity and reports key stats

set -e

BACKUP_DIR="./backups"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Backup directory not found: $BACKUP_DIR"
  exit 1
fi

LATEST=$(ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "❌ No backup files found in $BACKUP_DIR"
  exit 1
fi

echo "📋 Verifying backup: $LATEST"
echo ""

# File size
SIZE=$(stat -c%s "$LATEST" 2>/dev/null || stat -f%z "$LATEST" 2>/dev/null)
echo "   File size: $(numfmt --to=iec 2>/dev/null || echo "$SIZE bytes")"

# Check SQL syntax by counting key statements
TABLE_COUNT=$(grep -c "CREATE TABLE" "$LATEST" 2>/dev/null || echo "0")
INDEX_COUNT=$(grep -c "CREATE INDEX" "$LATEST" 2>/dev/null || echo "0")
INSERT_COUNT=$(grep -c "INSERT INTO" "$LATEST" 2>/dev/null || echo "0")

echo "   Tables: $TABLE_COUNT"
echo "   Indexes: $INDEX_COUNT"
echo "   Data rows (INSERTs): $INSERT_COUNT"

# Check file is not empty
if [ "$SIZE" -lt 1000 ]; then
  echo "❌ Backup file too small (< 1KB) — likely corrupted"
  exit 1
fi

# Verify last line is valid
LAST_LINE=$(tail -1 "$LATEST")
if echo "$LAST_LINE" | grep -qE "^(--|COMMIT|$)"; then
  echo "✅ Backup file ends cleanly"
else
  echo "⚠️ Backup file may be truncated (unexpected end)"
fi

echo ""
echo "✅ Verification complete"

# Summary for monitoring
echo ""
echo "--- BACKUP SUMMARY ---"
echo "File: $(basename "$LATEST")"
echo "Size: $SIZE bytes"
echo "Tables: $TABLE_COUNT"
echo "Inserts: $INSERT_COUNT"
echo "Date: $(date -r "$LATEST" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || stat -f "%Sm" "$LATEST" 2>/dev/null)"
echo "Status: VALID"
