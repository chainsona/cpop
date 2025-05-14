'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, FilePenLine, BookOpen, Award, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { POPTabNav } from '@/components/pop/pop-tab-nav';
import { useEffect, useState } from 'react';
import { usePageTitle } from '@/contexts/page-title-context';
import { toast } from 'sonner';
import { useWalletContext } from '@/contexts/wallet-context';
import { POPConfigLayout } from '@/components/pop/pop-config-layout';
import { POPImageDisplay } from '@/components/pop/pop-image-display';
import { TokenWarning } from '@/components/pop/token-warning';
import { POPInfoDisplay } from '@/components/pop/pop-info-display';
import { POPAnalytics, AnalyticsData } from '@/components/pop/analytics/pop-analytics';
import { POPClaimSection } from '@/components/pop/pop-claim-section';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { Share } from '@/components/ui/share';
import { notFound } from 'next/navigation';
import { POPDetailSkeleton } from '@/components/pop/pop-detail-skeleton';

// Define the POP type including status
interface POP {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  website: string | null;
  startDate: Date;
  endDate: Date;
  attendees: number | null;
  status: 'Draft' | 'Published' | 'Distributed' | 'Active' | 'Disabled' | 'Deleted';
  createdAt: Date;
  updatedAt: Date;
  token?: {
    id: string;
    mintAddress: string;
    supply: number;
    decimals: number;
    metadataUri?: string;
    metadataUpdatedAt?: Date;
    updatedAt?: Date;
  } | null;
  creator?: {
    walletAddress: string;
  } | null;
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
function getStatusDisplay(status: 'Draft' | 'Published' | 'Distributed' | 'Active' | 'Disabled' | 'Deleted') {
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
    case 'Active':
      return {
        label: 'Active',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-200',
        icon: <Award className="h-3.5 w-3.5" />,
      };
    case 'Disabled':
      return {
        label: 'Disabled',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        icon: <XCircle className="h-3.5 w-3.5" />,
      };
    case 'Deleted':
      return {
        label: 'Deleted',
        color: 'text-white',
        bgColor: 'bg-neutral-700',
        borderColor: 'border-neutral-800',
        icon: <Trash2 className="h-3.5 w-3.5" />,
      };
  }
}

interface POPDetailClientPageProps {
  id: string;
}

export default function POPDetailClientPage({ id }: POPDetailClientPageProps) {
  const { isAuthenticated, walletAddress, authenticate, connect, isConnected } = useWalletContext();

  const { setPageTitle } = usePageTitle();
  const [pop, setPop] = useState<POP | null>(null);
  const [distributionStatus, setDistributionStatus] = useState<
    'complete' | 'incomplete' | 'partial'
  >('incomplete');
  const [distributionSummary, setDistributionSummary] = useState('No claim methods configured');
  const [settingsStatus, setSettingsStatus] = useState<'complete' | 'incomplete' | 'partial'>(
    'incomplete'
  );
  const [settingsSummary, setSettingsSummary] = useState('Default settings');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artists, setArtists] = useState<Array<{ name: string; url: string }>>([]);
  const [organization, setOrganization] = useState<{ name: string; url: string } | null>(null);
  const [metadataOutdated, setMetadataOutdated] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Check for metadata outdated flag in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isOutdated = localStorage.getItem(`pop-${id}-metadata-outdated`) === 'true';
      if (isOutdated) {
        setMetadataOutdated(true);
      }
    }
  }, [id]);

  // Clear metadata outdated flag when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`pop-${id}-metadata-outdated`);
      }
    };
  }, [id]);

  // Function to handle metadata update
  const handleMetadataUpdated = () => {
    setMetadataOutdated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`pop-${id}-metadata-outdated`);
    }
  };

  // Fetch POP data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch POP details
        const popResponse = await fetch(`/api/pops/${id}`);
        if (!popResponse.ok) {
          if (popResponse.status === 404) {
            notFound();
          }
          if (popResponse.status === 401 || popResponse.status === 403) {
            // Handle unauthorized/forbidden - but still try to get public data
            const publicResponse = await fetch(`/api/pops/${id}/public`);
            if (publicResponse.ok) {
              const publicData = await publicResponse.json();
              setPop(publicData.pop);

              // Set page title based on POP title
              if (publicData.pop?.title) {
                setPageTitle(publicData.pop.title);
              }
            } else {
              throw new Error('Unable to access POP details');
            }
          } else {
            throw new Error('Failed to fetch POP');
          }
        } else {
          const popData = await popResponse.json();
          setPop(popData.pop);

          // Set page title based on POP title
          if (popData.pop?.title) {
            setPageTitle(popData.pop.title);
          }

          // Only fetch additional details if authenticated
          if (isAuthenticated) {
            // Use Promise.all to fetch data in parallel
            const promises = [
              fetch(`/api/pops/${id}/distribution`),
              fetch(`/api/pops/${id}/attributes`),
              fetch(`/api/pops/${id}/settings`),
            ];

            // Wait for all requests to complete
            const [distributionResponse, attributesResponse, settingsResponse] =
              await Promise.all(promises);

            // Process distribution data
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

            // Process attributes data
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

                // Store artists and organization data
                if (attrs.artists && attrs.artists.length > 0) {
                  setArtists(
                    attrs.artists.map((artist: any) => ({
                      name: artist.name,
                      url: artist.url || '',
                    }))
                  );
                }

                if (attrs.organization) {
                  setOrganization({
                    name: attrs.organization.name,
                    url: attrs.organization.url || '',
                  });
                }
              }
            }

            // Process settings data
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
            }
          } else {
            // For unauthenticated users, still try to fetch basic public attributes
            try {
              const publicAttributesResponse = await fetch(`/api/pops/${id}/attributes/public`);
              if (publicAttributesResponse.ok) {
                const data = await publicAttributesResponse.json();

                if (data.attributes) {
                  // Store only public information about artists and organization
                  if (data.attributes.artists && data.attributes.artists.length > 0) {
                    setArtists(
                      data.attributes.artists.map((artist: any) => ({
                        name: artist.name,
                        url: artist.url || '',
                      }))
                    );
                  }

                  if (data.attributes.organization) {
                    setOrganization({
                      name: data.attributes.organization.name,
                      url: data.attributes.organization.url || '',
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching public attributes:', error);
              // Non-critical error, don't prevent rendering
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load POP details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Clean up - reset page title when leaving the page
    return () => {
      setPageTitle('');
    };
  }, [id, setPageTitle, isAuthenticated]);

  // Fetch analytics data only when the component mounts and user is authenticated
  // Use a separate effect to avoid blocking the main UI rendering
  useEffect(() => {
    if (!isAuthenticated || !pop) return;

    const fetchAnalyticsData = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);

        const response = await fetch(`/api/pops/${id}/analytics`);

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        setAnalyticsData(data.analyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setAnalyticsError('Failed to load analytics data');
        toast.error('Failed to load analytics data');
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [id, isAuthenticated, pop]);

  if (isLoading) {
    return <POPDetailSkeleton />;
  }

  if (error || !pop) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{error || 'Unable to load POP details'}</h2>
          <p className="text-neutral-600 mb-6">Please try again later.</p>
          <Button variant="outline" asChild>
            <Link href="/pops">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to POPs
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const palette = getColorPaletteForId(pop.id);
  const statusDisplay = getStatusDisplay(pop.status);
  const isOwner =
    isAuthenticated &&
    walletAddress &&
    pop.creator &&
    pop.creator.walletAddress === walletAddress;

  // Generate the canonical URL for this POP
  const fullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/pops/${pop.id}`
      : `/pops/${pop.id}`;

  return (
    <div className="px-4 sm:px-6 py-6 pb-16">
      {/* Back link */}
      <div className="max-w-6xl mx-auto mb-4">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/pops" className="text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to POPs
          </Link>
        </Button>
      </div>

      {/* Main content area */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Left column with POP image and info */}
          <div className="md:col-span-1">
            {/* POP title displayed on mobile only */}
            <h1 className="text-2xl font-bold mb-4 md:hidden">{pop.title}</h1>

            <POPImageDisplay
              id={pop.id}
              imageUrl={pop.imageUrl}
              title={pop.title}
              className="mb-6"
            />

            {/* Basic POP information */}
            <div className="mb-8">
              <POPInfoDisplay
                pop={pop}
                organization={organization}
                artists={artists}
                metadataOutdated={metadataOutdated}
                onMetadataUpdated={handleMetadataUpdated}
                isAuthenticated={isAuthenticated}
                isCreator={!!isOwner}
              />
            </div>
          </div>

          {/* Right column with main content */}
          <div className="md:col-span-2">
            {/* POP title and actions - hidden on mobile, shown on desktop */}
            <div className="mb-6 hidden md:flex flex-wrap justify-between items-start gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold">{pop.title}</h1>

              <div className="flex gap-2">
                {/* Share button - available for all users */}
                <Share
                  title={`POP: ${pop.title}`}
                  description={pop.description}
                  url={fullUrl}
                  variant="outline"
                  size="sm"
                  splitButton={true}
                />

                {/* Edit button - only for authenticated users who are creators */}
                {isAuthenticated && isOwner && (
                  <Link href={`/pops/${pop.id}/edit`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Pencil className="h-4 w-4" />
                      Edit POP
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Edit/Share buttons for mobile - share for all, edit for authenticated owners */}
            <div className="mb-4 flex md:hidden justify-end gap-2">
              <Share
                title={`POP: ${pop.title}`}
                description={pop.description}
                url={fullUrl}
                variant="outline"
                size="sm"
                splitButton={true}
              />

              {isAuthenticated && isOwner && (
                <Link href={`/pops/${pop.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-4 w-4" />
                    Edit POP
                  </Button>
                </Link>
              )}
            </div>

            {/* Token warning for POPs without tokens - only for authenticated creators */}
            {isAuthenticated && isOwner && (!pop.token || !pop.token.mintAddress) && (
              <TokenWarning popId={pop.id} />
            )}

            {/* Description visible to all users */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <div className="prose max-w-none">
                {pop.description ? (
                  <p>{pop.description}</p>
                ) : (
                  <p className="text-neutral-500 italic">No description provided</p>
                )}
              </div>
            </div>

            {/* Different content based on user role */}
            {isAuthenticated && !isOwner ? (
              // User view - show claim section
              <div className="mb-8">
                <POPClaimSection popId={pop.id} title={pop.title} />
              </div>
            ) : isOwner ? (
              // Creator view - show full configuration options
              <>
                {/* Configuration cards section - only for authenticated creators */}
                <POPConfigLayout
                  popId={pop.id}
                  distributionStatus={distributionStatus}
                  distributionSummary={distributionSummary}
                  tokenStatus={pop.token ? 'complete' : 'incomplete'}
                  tokenSummary={pop.token ? 'Token configured' : 'No token configured'}
                  settingsStatus={settingsStatus}
                  settingsSummary={settingsSummary}
                  className="mb-8"
                />

                {/* POP tabs navigation - only for authenticated users */}
                <div className="mb-8">
                  <POPTabNav popId={pop.id} />
                </div>

                {/* Analytics section - only for authenticated users */}
                <POPAnalytics
                  popId={pop.id}
                  analyticsData={analyticsData}
                  analyticsLoading={analyticsLoading}
                  analyticsError={analyticsError}
                />
              </>
            ) : (
              // Non-authenticated user view - show authenticate prompt
              <div className="mb-8">
                <Card className="border border-neutral-200 shadow-sm">
                  <CardHeader>
                    <CardTitle>Claim this POP</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="bg-blue-50 border-blue-200 mb-4">
                      <Info className="h-4 w-4 text-blue-500" />
                      <AlertTitle>Authentication Required</AlertTitle>
                      <AlertDescription>
                        You need to connect and authenticate your wallet before claiming this POP.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={async () => {
                        if (!isConnected) {
                          await connect();
                        }
                        await authenticate();
                      }}
                      className="w-full"
                    >
                      Authenticate to Claim
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
