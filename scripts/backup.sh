#!/bin/bash

# Min Nail & Hair Database Backup Script
# Requirements: Supabase CLI installed and authenticated

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "🚀 Starting database backup for Min Nail & Hair..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Dump schema and data
# Note: Assumes SUPABASE_PROJECT_ID and SUPABASE_DB_PASSWORD are set in environment
echo "📦 Dumping database schema and data..."
supabase db dump --project-ref "$SUPABASE_PROJECT_ID" -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup successfully created: $BACKUP_FILE"
else
  echo "❌ Backup failed!"
  exit 1
fi

# Optional: Clean up backups older than 30 days
find "$BACKUP_DIR" -type f -name "backup_*.sql" -mtime +30 -delete
echo "🧹 Cleaned up old backups."

echo "🏁 Backup process completed."
