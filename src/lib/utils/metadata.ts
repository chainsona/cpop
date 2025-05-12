import type { Metadata, Viewport } from 'next';

// App name constant to ensure consistency with page-title-context
const APP_NAME = 'POP';
const DEFAULT_DESCRIPTION = 'Manage Proof of Participation Protocol tokens for your events';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cpop.maikers.com'; // Update with actual production URL
const DEFAULT_LOGO = '/logo.png'; // Default logo image path (relative to public)
const DEFAULT_OG_IMAGE = '/og-image.jpg'; // Default OG image path (relative to public)

/**
 * Generate metadata for a page with the given title
 * This is useful for pages that don't have client components that set their title
 *
 * @param title The page title
 * @param description Optional description, defaults to the app description
 * @param options Additional metadata options
 * @returns Metadata object for the page
 */
export function generateMetadata(
  title: string,
  description = DEFAULT_DESCRIPTION,
  options?: {
    /** Image URL for Open Graph and Twitter cards */
    imageUrl?: string;
    /** Canonical URL for the page */
    canonicalUrl?: string;
    /** Type of content (default: website) */
    type?: 'website' | 'article' | 'profile';
    /** Logo image URL */
    logoUrl?: string;
    /** Locale for the content */
    locale?: string;
  }
): Metadata {
  // Ensure clean title without app name for og/twitter
  const cleanTitle = title.replace(` | ${APP_NAME}`, '').trim();
  const fullTitle = `${title} | ${APP_NAME}`;

  // Create absolute URLs for all resources
  let imageUrl = options?.imageUrl || DEFAULT_OG_IMAGE;
  imageUrl = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;

  const url = options?.canonicalUrl || BASE_URL;
  const type = options?.type || 'website';

  let logoUrl = options?.logoUrl || DEFAULT_LOGO;
  logoUrl = logoUrl.startsWith('http') ? logoUrl : `${BASE_URL}${logoUrl}`;

  const locale = options?.locale || 'en-US';

  // For metadataBase, ensure we have a valid URL
  let metadataBaseUrl;
  try {
    metadataBaseUrl = new URL(BASE_URL);
  } catch (e) {
    // Fallback to a known valid URL if the BASE_URL is invalid
    metadataBaseUrl = new URL('https://cpop.maikers.com');
  }

  return {
    title: fullTitle,
    description,
    metadataBase: metadataBaseUrl,
    openGraph: {
      title: cleanTitle,
      description,
      type,
      url,
      locale,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: cleanTitle,
        },
      ],
      siteName: APP_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description,
      images: [imageUrl],
      creator: '@popplatform',
    },
    alternates: {
      canonical: url,
    },
    other: {
      'og:logo': logoUrl,
    },
  };
}

/**
 * Generate viewport metadata
 * @returns Viewport object
 */
export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: [
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#121212' },
    ],
  };
}
