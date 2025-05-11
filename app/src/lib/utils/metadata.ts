import type { Metadata } from 'next';

/**
 * Generate metadata for a page with the given title
 * This is useful for pages that don't have client components that set their title
 * 
 * @param title The page title
 * @param description Optional description, defaults to the app description
 * @returns Metadata object for the page
 */
export function generateMetadata(
  title: string,
  description = 'Manage Proof of Attendance Protocol tokens for your events'
): Metadata {
  return {
    title,
    description,
  };
} 