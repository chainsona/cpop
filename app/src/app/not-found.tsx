import { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  generateMetadata as baseGenerateMetadata,
  generateViewport
} from '@/lib/utils/metadata';

export const metadata: Metadata = baseGenerateMetadata(
  'Page Not Found',
  'The requested page could not be found'
);

export const viewport: Viewport = generateViewport();

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-neutral-600 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
