// Functions related to document handling

/**
 * Generates a UID for a document
 * Format: UID-{date}-{time}-USR{userId}-CPY{companyId}-{random}
 */
export function generateDocumentUID(userId: number, companyId: number): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  return `UID-${date}-${time}-USR${userId.toString().padStart(4, '0')}-CPY${companyId.toString().padStart(4, '0')}-${random}`;
}

/**
 * Generates a token for a document
 * Format: DOC-{date}-{time}-{random}
 */
export function generateDocumentToken(): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 15);
  
  return `DOC-${date}-${time}-${random}`;
}

/**
 * Formats a date to French format
 */
export function formatDateToFrench(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculates a human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
