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
  AlertTriangle,
  Coins,
  Building,
  BarChart,
  RefreshCcw,
  MapPin,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InteractiveExternalLink } from '@/components/ui/interactive-link';
import { ConfigStatusCard } from '@/components/poap/config-status-card';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import { TokenStatusAlert } from '@/components/poap/token-status-alert';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { usePageTitle } from '@/contexts/page-title-context';
import { usePathname } from 'next/navigation';
import { ExportDataButton } from '@/components/analytics/export-data-button';
import { toast } from 'sonner';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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
  token?: {
    id: string;
    mintAddress: string;
    supply: number;
    decimals: number;
    metadataUri?: string;
    metadataUpdatedAt?: Date;
    updatedAt?: Date;
  } | null;
}

// Define the analytics data interface
interface AnalyticsData {
  totalClaims: number;
  availableClaims: number;
  claimMethods: { method: string; count: number }[];
  claimsByDay: { date: string; count: number }[];
  mostActiveDay: {
    date: string | null;
    count: number;
  };
  topClaimMethod: {
    method: string | null;
    count: number;
    percentage: number;
  };
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

// Token warning component for POAPs without minted tokens
function TokenWarning({ poapId }: { poapId: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 items-start mb-6">
      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-medium text-amber-800 mb-1">No tokens minted yet</h3>
        <p className="text-amber-700 text-sm mb-3">
          This POAP doesn't have any compressed tokens minted yet. Start by creating a distribution
          method to automatically mint tokens for your participants.
        </p>
        <Link href={`/poaps/${poapId}/distribution`}>
          <Button size="sm" variant="outline" className="bg-white gap-1.5">
            <Coins className="h-4 w-4" />
            Create Distribution Method
          </Button>
        </Link>
      </div>
    </div>
  );
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
  const [attributesStatus, setAttributesStatus] = useState<'complete' | 'incomplete' | 'partial'>(
    'incomplete'
  );
  const [attributesSummary, setAttributesSummary] = useState('No attributes configured');
  const [settingsStatus, setSettingsStatus] = useState<'complete' | 'incomplete' | 'partial'>(
    'incomplete'
  );
  const [settingsSummary, setSettingsSummary] = useState('Default settings');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDistributionMethods, setActiveDistributionMethods] = useState<number>(0);
  const [artists, setArtists] = useState<Array<{ name: string; url: string }>>([]);
  const [organization, setOrganization] = useState<{ name: string; url: string } | null>(null);
  const [metadataOutdated, setMetadataOutdated] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Colors for pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  // Format dates to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Transform data for chart display
  const chartData = useMemo(() => {
    if (!analyticsData?.claimsByDay || analyticsData.claimsByDay.length === 0) {
      return [];
    }

    return analyticsData.claimsByDay.map(item => ({
      ...item,
      date: formatDate(item.date),
    }));
  }, [analyticsData]);

  // Custom label for pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Check for metadata outdated flag in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isOutdated = localStorage.getItem(`poap-${id}-metadata-outdated`) === 'true';
      if (isOutdated) {
        setMetadataOutdated(true);
      }
    }
  }, [id]);

  // Clear metadata outdated flag when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`poap-${id}-metadata-outdated`);
      }
    };
  }, [id]);

  // Function to handle metadata update
  const handleMetadataUpdated = () => {
    setMetadataOutdated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`poap-${id}-metadata-outdated`);
    }
  };

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

          // Set active distribution methods count
          setActiveDistributionMethods(activeMethods.length);

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

              let summary = '';
              let status: 'complete' | 'incomplete' | 'partial' = 'incomplete';

              // Determine the status based on field completeness
              if (hasEventType && (hasLocation || hasPlatform)) {
                if (hasOrganization) {
                  // Mark as complete if organization is set, regardless of artists
                  status = 'complete';
                  summary = hasArtists
                    ? 'All attributes configured'
                    : 'Essential attributes configured';
                } else {
                  status = 'partial';
                  const missing = [];
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

  // Fetch analytics data from the API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      const response = await fetch(`/api/poaps/${id}/analytics`);

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
  }, [id]);

  // Load analytics data on mount
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

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

  // Format date for display
  const formatMostActiveDay = (dateString: string | null) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

        {/* Show token status alert if no tokens have been minted but there are active distribution methods */}
        {poap && (
          <TokenStatusAlert
            tokenStatus={{
              minted: !!poap.token,
              supply: poap.token?.supply || 0,
              metadataOutdated: metadataOutdated,
              lastUpdated: poap.token?.updatedAt
                ? new Date(poap.token.updatedAt).toISOString()
                : undefined,
            }}
            poapId={id}
            hasDistributionMethods={activeDistributionMethods > 0}
            onTokensMinted={newSupply => {
              // Update the local state when tokens are minted
              setPoap({
                ...poap,
                token: {
                  id: poap.token?.id || `temp-${id}`,
                  mintAddress: poap.token?.mintAddress || 'pending',
                  supply: newSupply,
                  decimals: poap.token?.decimals || 0,
                },
              });
            }}
            onMetadataUpdated={handleMetadataUpdated}
          />
        )}

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

                  {/* Token information - new section */}
                  {poap.token && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500 mb-2">Tokens</h3>
                      <div className="flex items-center gap-2 text-neutral-700">
                        <Award className="h-4 w-4 text-purple-500" />
                        <span>{poap.token.supply.toLocaleString()} tokens minted</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Artist and Organization Information */}
                {(artists.length > 0 || organization) && (
                  <div className="mt-6 space-y-6">
                    {artists.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-2">
                          Artist Details
                        </h3>
                        <div className="space-y-3">
                          {artists.map((artist, index) => (
                            <div key={index} className="flex items-start gap-2 text-neutral-700">
                              <User className="h-4 w-4 text-pink-500 mt-0.5" />
                              <div>
                                <span className="font-medium">{artist.name}</span>
                                {artist.url && (
                                  <div className="mt-1">
                                    <InteractiveExternalLink
                                      href={artist.url}
                                      className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                      ariaLabel={`Visit ${artist.name}'s website`}
                                    >
                                      {artist.url}
                                    </InteractiveExternalLink>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {organization && (
                      <div>
                        <h3 className="text-sm font-medium text-neutral-500 mb-2">Organization</h3>
                        <div className="flex items-start gap-2 text-neutral-700">
                          <Building className="h-4 w-4 text-blue-500 mt-0.5" />
                          <div>
                            <span className="font-medium">{organization.name}</span>
                            {organization.url && (
                              <div className="mt-1">
                                <InteractiveExternalLink
                                  href={organization.url}
                                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                  ariaLabel={`Visit ${organization.name}'s website`}
                                >
                                  {organization.url}
                                </InteractiveExternalLink>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Use the shared tab navigation component */}
        <div className="mt-8">
          <POAPTabNav poapId={id} />

          {/* Overview Tab Content */}
          <div className="p-6 bg-white border-x border-b border-neutral-200 rounded-b-xl">
            {/* Overview Section */}
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-4">POAP Configuration</h2>
              
              {/* Configuration cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ConfigStatusCard
                title="Distribution"
                status={distributionStatus}
                icon={<Users className="h-5 w-5" />}
                href={`/poaps/${id}/distribution`}
                summary={distributionSummary}
                  className="h-full"
              />
              <ConfigStatusCard
                title="Token"
                status={
                  poap.token ? 'complete' : activeDistributionMethods > 0 ? 'error' : 'incomplete'
                }
                icon={<Coins className="h-5 w-5" />}
                href={`/poaps/${id}/token`}
                summary={
                  poap.token
                    ? `${poap.token.supply.toLocaleString()} tokens minted`
                    : 'No tokens minted yet'
                }
                  className="h-full"
              />
              <ConfigStatusCard
                title="Metadata"
                status={attributesStatus}
                icon={<User className="h-5 w-5" />}
                href={`/poaps/${id}/attributes`}
                summary={attributesSummary}
                  className="h-full"
              />
              <ConfigStatusCard
                title="Settings"
                status={settingsStatus}
                icon={<Settings className="h-5 w-5" />}
                href={`/poaps/${id}/settings`}
                summary={settingsSummary}
                  className="h-full"
              />
            </div>
          </div>
            
            {/* Analytics Section */}
            <div className="mt-8 pt-8 border-t border-neutral-200">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold">Analytics</h2>
                  <p className="text-neutral-600 text-sm mt-1">
                    Track claims and usage data for your POAP
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {analyticsData && (
                    <ExportDataButton 
                      data={analyticsData} 
                      filename={`poap-${id}-analytics`} 
                      defaultFormat="json" 
                    />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={fetchAnalyticsData}
                    disabled={analyticsLoading}
                  >
                    <RefreshCcw className={`h-4 w-4 ${analyticsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
              
              {analyticsLoading ? (
                <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-neutral-600">Loading analytics data...</p>
                </div>
              ) : analyticsError ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Analytics</h3>
                  <p className="text-red-600 mb-6">{analyticsError}</p>
                  <Button onClick={fetchAnalyticsData}>Try Again</Button>
                </div>
              ) : !analyticsData ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8 text-center">
                  <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                    No Analytics Data Available
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    Add distribution methods and get claims to see analytics data.
                  </p>
                  <Link href={`/poaps/${id}/distribution`}>
                    <Button>Set Up Distribution</Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 rounded-full p-1.5">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-medium">Total Claims</h3>
                      </div>
                      <p className="text-3xl font-bold">{analyticsData.totalClaims || 0}</p>
                      <p className="text-sm text-neutral-500 mt-1">
                        Out of {analyticsData.availableClaims || 0} available
                      </p>
                    </div>

                    <div className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-emerald-100 rounded-full p-1.5">
                          <Calendar className="h-5 w-5 text-emerald-600" />
                        </div>
                        <h3 className="font-medium">Most Active Day</h3>
                      </div>
                      <p className="text-3xl font-bold">
                        {analyticsData.mostActiveDay?.date
                          ? formatMostActiveDay(analyticsData.mostActiveDay.date)
                          : 'None'}
                      </p>
                      <p className="text-sm text-neutral-500 mt-1">
                        {analyticsData.mostActiveDay?.count || 0} claims
                      </p>
                    </div>

                    <div className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-orange-100 rounded-full p-1.5">
                          <MapPin className="h-5 w-5 text-orange-600" />
                        </div>
                        <h3 className="font-medium">Top Claim Method</h3>
                      </div>
                      <p className="text-3xl font-bold">{analyticsData.topClaimMethod?.method || 'None'}</p>
                      <p className="text-sm text-neutral-500 mt-1">
                        {analyticsData.topClaimMethod?.count || 0} claims
                        {analyticsData.topClaimMethod?.percentage
                          ? ` (${analyticsData.topClaimMethod.percentage}%)`
                          : ''}
                      </p>
                    </div>
                  </div>

                  {/* Analytics tabs */}
                  <div className="mt-8">
                    <div className="border-b border-neutral-200 mb-6">
                      <div className="flex space-x-6">
                        <button 
                          className="px-1 py-2 border-b-2 border-blue-600 text-blue-600 font-medium text-sm"
                          onClick={() => {}}
                        >
                          Claims Over Time
                        </button>
                        <button 
                          className="px-1 py-2 border-b-2 border-transparent hover:text-neutral-900 text-neutral-600 font-medium text-sm"
                          onClick={() => {}}
                        >
                          Claim Methods
                        </button>
                      </div>
                    </div>
                  
                    {/* Bar Chart */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center">
                          <BarChart className="h-5 w-5 text-blue-600 mr-2" />
                          Claims Over Time
                        </h2>
                      </div>

                      {chartData.length > 0 ? (
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart
                              data={chartData}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                              <RechartsTooltip
                                formatter={value => [`${value} claims`, 'Claims']}
                                labelFormatter={label => `Date: ${label}`}
                                contentStyle={{
                                  borderRadius: '6px',
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                }}
                              />
                              <Bar dataKey="count" name="Claims" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-center">
                          <p className="text-neutral-500">No claim data available</p>
                        </div>
                      )}

                      <p className="text-sm text-neutral-500 mt-4">
                        This chart shows the number of claims per day over time.
                      </p>
                    </div>

                    {/* Claims by method container */}
                    {analyticsData.claimMethods.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                        {/* Pie Chart */}
                        <div className="md:col-span-2 bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-sm transition-shadow">
                          <h2 className="text-lg font-semibold mb-4 flex items-center">
                            <PieChartIcon className="h-5 w-5 text-emerald-600 mr-2" />
                            Claims by Method
                          </h2>

                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={analyticsData.claimMethods}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={renderCustomizedLabel}
                                  outerRadius={80}
                                  innerRadius={40}
                                  fill="#8884d8"
                                  dataKey="count"
                                  nameKey="method"
                                >
                                  {analyticsData.claimMethods.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip
                                  formatter={value => [`${value} claims`, 'Claims']}
                                  contentStyle={{
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                  }}
                                />
                                <Legend
                                  formatter={(value, entry, index) => (
                                    <span style={{ color: '#4b5563' }}>{value}</span>
                                  )}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Claims by method table */}
                        <div className="md:col-span-3 bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-sm transition-shadow">
                          <h2 className="text-lg font-semibold mb-4">Method Details</h2>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-200">
                                  <th className="px-4 py-2 text-left font-medium">Method</th>
                                  <th className="px-4 py-2 text-right font-medium">Claims</th>
                                  <th className="px-4 py-2 text-right font-medium">Percentage</th>
                                </tr>
                              </thead>
                              <tbody>
                                {analyticsData.claimMethods.map((method, index) => (
                                  <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                                    <td className="px-4 py-3 flex items-center">
                                      <div
                                        className="w-3 h-3 mr-2 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                      />
                                      {method.method}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">{method.count}</td>
                                    <td className="px-4 py-3 text-right">
                                      {Math.round((method.count / analyticsData.totalClaims) * 100)}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center">
                        <PieChartIcon className="h-8 w-8 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-700 mb-2">No Claim Methods Data</h3>
                        <p className="text-neutral-600 mb-2">
                          Configure distribution methods and get claims to see analytics.
                        </p>
                        <Link href={`/poaps/${id}/distribution`} className="inline-block mt-2">
                          <Button variant="outline" size="sm">
                            Set Up Distribution
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
