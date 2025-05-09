'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BarChart,
  Users,
  Calendar,
  MapPin,
  RefreshCcw,
  Download,
  PieChart as PieChartIcon,
  AlertCircle,
} from 'lucide-react';
import { POAPTabNav } from '@/components/poap/poap-tab-nav';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';

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

export default function POAPAnalyticsPage() {
  const pathname = usePathname();
  // Extract ID from URL path: /poaps/[id]/analytics
  const id = useMemo(() => pathname.split('/')[2], [pathname]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Colors for pie chart
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  // Fetch analytics data from the API
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/poaps/${id}/analytics`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data.analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Load data on mount
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

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

  // Format date for display
  const formatMostActiveDay = (dateString: string | null) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href={`/poaps/${id}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to POAP
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <POAPTabNav poapId={id} />
          </div>

          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href={`/poaps/${id}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to POAP
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <POAPTabNav poapId={id} />
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Failed to Load Analytics</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={fetchAnalyticsData}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!analyticsData) {
    return (
      <div className="container mx-auto py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href={`/poaps/${id}`}>
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to POAP
              </Button>
            </Link>
          </div>

          <div className="mb-8">
            <POAPTabNav poapId={id} />
          </div>

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
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href={`/poaps/${id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to POAP
            </Button>
          </Link>
        </div>

        {/* Use the shared tab navigation */}
        <div className="mb-8">
          <POAPTabNav poapId={id} />
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Analytics</h2>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={fetchAnalyticsData}
              disabled={isLoading}
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium">Total Claims</h3>
            </div>
            <p className="text-3xl font-bold">{analyticsData.totalClaims || 0}</p>
            <p className="text-sm text-neutral-500 mt-1">
              Out of {analyticsData.availableClaims || 0} available
            </p>
          </div>

          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
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

          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-orange-600" />
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

        {/* Bar Chart */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart className="h-5 w-5 text-blue-600 mr-2" />
            Claims Over Time
          </h2>

          {chartData.length > 0 ? (
            <div className="h-64">
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
                  <Tooltip
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
            <div className="md:col-span-2 bg-white rounded-xl border border-neutral-200 p-6">
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
                    <Tooltip
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
            <div className="md:col-span-3 bg-white rounded-xl border border-neutral-200 p-6">
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
                      <tr key={index} className="border-b border-neutral-100">
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
    </div>
  );
}
