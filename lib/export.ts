/**
 * Data Export Utilities
 * Handles conversion of database records to CSV and JSON formats
 */

export type ExportFormat = 'csv' | 'json';

export function convertToCSV<T extends object>(data: T[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Headers
  csvRows.push(headers.join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = (row as any)[header];
      if (val === null || val === undefined) return '';

      
      const stringVal = String(val);
      // Escape quotes and wrap in quotes if contains comma, quote or newline
      if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\\n')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\\n');
}

export function convertToJSON<T extends object>(data: T[]): string {
  return JSON.stringify(data, null, 2);
}

export function getExportFilename(type: string, format: ExportFormat, date: string = new Date().toISOString().split('T')[0]): string {
  return `min_salon_${type}_${date}.${format}`;
}
