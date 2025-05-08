import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDateRange } from '@/lib/date-utils';
import { Calendar, Hash, ArrowLeft, Pencil, FilePenLine, BookOpen, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InteractiveExternalLink } from '@/components/ui/interactive-link';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

// Define the POAP type including status
interface POAP {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  website: string | null;
  startDate: Date;
  endDate: Date;
  supply: number | null;
  status: 'Draft' | 'Published' | 'Distributed';
  createdAt: Date;
  updatedAt: Date;
}

// Simple StatusBadge component
function StatusBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold',
        className
      )}
    >
      {children}
    </div>
  );
}

// Determine image type (external URL or base64)
function isBase64Image(url: string): boolean {
  return url.startsWith('data:image/');
}

// Color palettes - mapped to Tailwind config custom gradients
const COLOR_PALETTES = [
  {
    background: 'bg-blue-50',
    gradient: 'bg-blue-radial',
  },
  {
    background: 'bg-purple-50',
    gradient: 'bg-purple-radial',
  },
  {
    background: 'bg-green-50',
    gradient: 'bg-green-radial',
  },
  {
    background: 'bg-orange-50',
    gradient: 'bg-orange-radial',
  },
  {
    background: 'bg-pink-50',
    gradient: 'bg-pink-radial',
  },
];

// Get a color palette based on the ID to ensure consistency
function getColorPaletteForId(id: string): (typeof COLOR_PALETTES)[0] {
  // Use the last character of the ID as a simple hash
  const lastChar = id.slice(-1);
  const index = parseInt(lastChar, 16) % COLOR_PALETTES.length;
  return COLOR_PALETTES[index >= 0 ? index : 0];
}

// Get status display information
function getStatusDisplay(status: 'Draft' | 'Published' | 'Distributed') {
  switch (status) {
    case 'Draft':
      return {
        label: 'Draft',
        color: 'text-neutral-600',
        bgColor: 'bg-neutral-100',
        borderColor: 'border-neutral-200',
        icon: <FilePenLine className="h-3.5 w-3.5" />,
      };
    case 'Published':
      return {
        label: 'Published',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        icon: <BookOpen className="h-3.5 w-3.5" />,
      };
    case 'Distributed':
      return {
        label: 'Distributed',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: <Award className="h-3.5 w-3.5" />,
      };
  }
}

export default async function POAPDetailPage(props: PageProps) {
  // Await the params object before accessing its properties per Next.js 15 requirement
  const { id } = await props.params;

  // Fetch the POAP from the database
  const poap = (await prisma.poap.findUnique({
    where: { id },
  })) as POAP | null; // Add explicit casting

  // If POAP not found, return 404
  if (!poap) {
    notFound();
  }

  // Get color palette and status
  const colorPalette = getColorPaletteForId(id);
  const statusDisplay = getStatusDisplay(poap.status);

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/poaps">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-neutral-600 hover:text-neutral-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to POAPs
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-sm p-6 md:p-8 transition-all duration-200 hover:shadow-md hover:border-neutral-300">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Image section with improved styling */}
            <div className="w-full lg:w-1/3 flex-shrink-0">
              <div className="aspect-square relative rounded-lg overflow-hidden shadow-md">
                {/* Status badge */}
                <div
                  className={cn(
                    'absolute top-2 left-2 z-20 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1.5',
                    statusDisplay.bgColor,
                    statusDisplay.color,
                    statusDisplay.borderColor,
                    'border'
                  )}
                >
                  {statusDisplay.icon}
                  {statusDisplay.label}
                </div>

                {/* Color background with custom Tailwind gradients */}
                <div className={cn('absolute inset-0 opacity-30', colorPalette.gradient)}></div>

                {/* Image display */}
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <img
                    src={poap.imageUrl}
                    alt={`POAP image: ${poap.title}`}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                </div>

                {/* Add a subtle inner shadow for depth */}
                <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)] rounded-lg pointer-events-none"></div>

                {isBase64Image(poap.imageUrl) && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md z-10">
                    Base64
                  </div>
                )}
              </div>
            </div>

            {/* Content section */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">{poap.title}</h1>
                  <StatusBadge
                    className={cn(
                      statusDisplay.bgColor,
                      statusDisplay.color,
                      statusDisplay.borderColor,
                      'border'
                    )}
                  >
                    {poap.status}
                  </StatusBadge>
                </div>
                <Link href={`/poaps/${id}/edit`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              </div>

              {/* Details list */}
              <div className="space-y-6 mb-8">
                <div>
                  <h3 className="text-sm font-medium text-neutral-500 mb-2">Description</h3>
                  <p className="text-neutral-700">{poap.description}</p>
                </div>

                <div className="flex flex-col md:flex-row md:gap-12 space-y-4 md:space-y-0">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-2">Date</h3>
                    <div className="flex items-center gap-2 text-neutral-700">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      {formatDateRange(poap.startDate, poap.endDate)}
                    </div>
                  </div>

                  {poap.supply && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Supply</h3>
                      <div className="flex items-center gap-2 text-neutral-700">
                        <Hash className="h-4 w-4 text-emerald-500" />
                        {poap.supply.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {poap.website && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Website</h3>
                      <InteractiveExternalLink
                        href={poap.website}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline"
                        ariaLabel={`Visit website for ${poap.title}`}
                      >
                        Visit website
                      </InteractiveExternalLink>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata and timestamps */}
              <div className="border-t border-neutral-200 pt-4 mt-6">
                <div className="text-xs text-neutral-500 space-y-1">
                  <p>Created: {poap.createdAt.toLocaleString()}</p>
                  <p>Last updated: {poap.updatedAt.toLocaleString()}</p>
                  <p>ID: {poap.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
