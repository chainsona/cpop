/**
 * Utility functions for exporting data in various formats
 */

/**
 * Convert data to CSV format
 * @param data Array of objects to convert to CSV
 * @returns CSV string
 */
export function convertToCSV<T extends Record<string, any>>(data: T[]): string {
  if (data.length === 0) return '';
  
  // Get headers from the first data item
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return headers.map(header => {
      // Handle values that need escaping (commas, quotes, etc.)
      const value = item[header];
      const valueStr = value === null || value === undefined ? '' : String(value);
      
      // If the value contains quotes, commas, or newlines, wrap it in quotes and escape any quotes
      if (valueStr.includes('"') || valueStr.includes(',') || valueStr.includes('\n')) {
        return `"${valueStr.replace(/"/g, '""')}"`;
      }
      return valueStr;
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
}

/**
 * Export data as a downloadable CSV file
 * @param data Data to export
 * @param filename Filename without extension
 */
export function exportAsCSV<T extends Record<string, any>>(data: T[], filename: string): void {
  const csv = convertToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data as a downloadable JSON file
 * @param data Data to export
 * @param filename Filename without extension
 */
export function exportAsJSON<T>(data: T, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Helper function to download a Blob as a file
 * @param blob Blob to download
 * @param filename Filename with extension
 */
function downloadBlob(blob: Blob, filename: string): void {
  // Create a link element
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Set link properties
  link.href = url;
  link.download = filename;
  
  // Append link to body, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
} 