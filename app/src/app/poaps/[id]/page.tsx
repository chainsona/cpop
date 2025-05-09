'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { formatDateRange } from '@/lib/date-utils';
import {
  Calendar,
  Hash,
  ArrowLeft,
  Pencil,
  FilePenLine,
  BookOpen,
  Award,
  Users,
  User,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InteractiveExternalLink } from '@/components/ui/interactive-link';
import { ConfigStatusCard } from '@/components/poap/config-status-card';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import { useEffect, useState } from 'react';
import { usePageTitle } from '@/contexts/page-title-context';
import { usePathname } from 'next/navigation';
// Define the POAP type including status
interface POAP {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  website: string | null;
  startDate: Date;
  endDate: Date;
  attendees: number | null;
  status: 'Draft' | 'Published' | 'Distributed' | 'Unclaimable';
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
function getStatusDisplay(status: 'Draft' | 'Published' | 'Distributed' | 'Unclaimable') {
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
    case 'Unclaimable':
      return {
        label: 'Unclaimable',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      };
  }
}

export default function POAPDetailPage() {
  const pathname = usePathname();
  const id = pathname.split('/')[2]; // Extract ID from URL path: /poaps/[id]
  
  const { setPageTitle } = usePageTitle();
  const [poap, setPoap] = useState<POAP | null>(null);
  const [distributionStatus, setDistributionStatus] = useState<
    'complete' | 'incomplete' | 'partial'
  >('incomplete');
  const [distributionSummary, setDistributionSummary] = useState('No claim methods configured');
  const [attributesStatus, setAttributesStatus] = useState<
    'complete' | 'incomplete' | 'partial'
  >('incomplete');
  const [attributesSummary, setAttributesSummary] = useState('No attributes configured');
  const [settingsStatus, setSettingsStatus] = useState<
    'complete' | 'incomplete' | 'partial'
  >('incomplete');
  const [settingsSummary, setSettingsSummary] = useState('Default settings');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch POAP data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch POAP details
        const poapResponse = await fetch(`/api/poaps/${id}`);
        if (!poapResponse.ok) {
          if (poapResponse.status === 404) {
            notFound();
          }
          throw new Error('Failed to fetch POAP');
        }

        const poapData = await poapResponse.json();
        setPoap(poapData.poap);

        // Set page title based on POAP title
        if (poapData.poap?.title) {
          setPageTitle(poapData.poap.title);
        }

        // Fetch distribution methods
        const distributionResponse = await fetch(`/api/poaps/${id}/distribution`);
        if (distributionResponse.ok) {
          const data = await distributionResponse.json();
          const methods = data.distributionMethods || [];
          const activeMethods = methods.filter((method: any) => !method.disabled);

          if (activeMethods.length > 0) {
            setDistributionStatus('complete');
            if (activeMethods.length === 1) {
              setDistributionSummary('1 claim method configured');
            } else {
              setDistributionSummary(`${activeMethods.length} claim methods configured`);
            }
          }
        }
        
        // Fetch attributes
        try {
          const attributesResponse = await fetch(`/api/poaps/${id}/attributes`);
          if (attributesResponse.ok) {
            const data = await attributesResponse.json();
            
            if (data.attributes) {
              // Check if all essential fields are filled
              const attrs = data.attributes;
              const hasEventType = !!attrs.eventType;
              const hasLocation = !!(attrs.eventType === 'Physical' && attrs.city);
              const hasPlatform = !!(attrs.eventType === 'Online' && attrs.platform);
              const hasArtists = !!(attrs.artists && attrs.artists.length > 0);
              const hasOrganization = !!attrs.organization;
              
              let summary = '';
              let status: 'complete' | 'incomplete' | 'partial' = 'incomplete';
              
              // Determine the status based on field completeness
              if (hasEventType && (hasLocation || hasPlatform)) {
                if (hasArtists && hasOrganization) {
                  status = 'complete';
                  summary = 'All attributes configured';
                } else {
                  status = 'partial';
                  const missing = [];
                  if (!hasArtists) missing.push('artist');
                  if (!hasOrganization) missing.push('organization');
                  summary = `${attrs.eventType === 'Physical' ? 'Location' : 'Platform'} set, ${missing.join(' and ')} missing`;
                }
              } else {
                status = 'incomplete';
                summary = 'Basic attributes missing';
              }
              
              setAttributesStatus(status);
              setAttributesSummary(summary);
            }
          } else if (attributesResponse.status !== 404) {
            // Only log errors that aren't 404 (404 is expected when no attributes exist yet)
            console.error('Error fetching attributes:', await attributesResponse.text());
          }
        } catch (attrError) {
          console.error('Exception fetching attributes:', attrError);
        }
        
        // Fetch settings
        try {
          const settingsResponse = await fetch(`/api/poaps/${id}/settings`);
          if (settingsResponse.ok) {
            const data = await settingsResponse.json();
            
            if (data.settings) {
              const settings = data.settings;
              // Settings are considered complete when at least visibility is set
              setSettingsStatus('complete');
              
              // Generate appropriate summary
              const visibility = settings.visibility || 'Public';
              const hasDates = !!(settings.defaultStartDate || settings.defaultEndDate);
              
              if (hasDates) {
                setSettingsSummary(`${visibility} with custom dates`);
              } else {
                setSettingsSummary(`${visibility} visibility configured`);
              }
            }
          } else if (settingsResponse.status !== 404) {
            // Only log errors that aren't 404 (404 is expected when no settings exist yet)
            console.error('Error fetching settings:', await settingsResponse.text());
          }
        } catch (settingsError) {
          console.error('Exception fetching settings:', settingsError);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load POAP details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Clean up - reset page title when leaving the page
    return () => {
      setPageTitle('');
    };
  }, [id, setPageTitle]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading POAP details...</p>
        </div>
      </div>
    );
  }

  if (error || !poap) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 mb-4">{error || 'POAP not found'}</p>
          <Link href="/poaps">
            <Button>Back to POAPs</Button>
          </Link>
        </div>
      </div>
    );
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

        <div className="bg-white rounded-xl overflow-hidden border border-neutral-200 shadow-sm p-6 md:p-8 transition-all duration-200 hover:shadow-md hover:border-neutral-300 mb-8">
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

                  {poap.attendees && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Attendees</h3>
                      <div className="flex items-center gap-2 text-neutral-700">
                        <Hash className="h-4 w-4 text-emerald-500" />
                        {poap.attendees.toLocaleString()}
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
                  <p>Created: {new Date(poap.createdAt).toLocaleString()}</p>
                  <p>Last updated: {new Date(poap.updatedAt).toLocaleString()}</p>
                  <p>ID: {poap.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use the shared tab navigation component */}
        <div className="mt-8">
          <POAPTabNav poapId={id} />

          {/* Overview Tab Content */}
          <div className="p-6 bg-white border-x border-b border-neutral-200 rounded-b-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <ConfigStatusCard
                title="Distribution"
                status={distributionStatus}
                icon={<Users className="h-5 w-5" />}
                href={`/poaps/${id}/distribution`}
                summary={distributionSummary}
              />
              <ConfigStatusCard
                title="Attributes"
                status={attributesStatus}
                icon={<User className="h-5 w-5" />}
                href={`/poaps/${id}/attributes`}
                summary={attributesSummary}
              />
              <ConfigStatusCard
                title="Settings"
                status={settingsStatus}
                icon={<Settings className="h-5 w-5" />}
                href={`/poaps/${id}/settings`}
                summary={settingsSummary}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
