import { useMemo } from 'react';
import { AlertTriangle, BarChart, PieChart as PieChartIcon } from 'lucide-react';
import { ExportDataButton } from '@/components/analytics/export-data-button';
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

// Define the analytics data interface
export interface AnalyticsData {
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

interface POPAnalyticsProps {
  popId: string;
  analyticsData: AnalyticsData | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
}

export function POPAnalytics({
  popId,
  analyticsData,
  analyticsLoading,
  analyticsError,
}: POPAnalyticsProps) {
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

  // Format most active day for display
  const formatMostActiveDay = (dateString: string | null) => {
    if (!dateString) return 'No data';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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

  if (analyticsLoading) {
    return (
      <div className="py-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-neutral-600">Loading analytics data...</p>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
        <p className="text-neutral-600">{analyticsError}</p>
      </div>
    );
  }

  if (!analyticsData || analyticsData.totalClaims === 0) {
    return (
      <div className="py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
        <PieChartIcon className="h-8 w-8 text-neutral-400 mx-auto mb-3" />
        <p className="text-neutral-600 font-medium mb-1">No claim data available</p>
        <p className="text-neutral-500 text-sm">
          Analytics will appear once people start claiming this POP.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart className="h-5 w-5 text-neutral-500" />
          Claim Analytics
        </h2>
        <ExportDataButton data={analyticsData} filename={`pop-${popId}-analytics`} />
      </div>

      {/* Analytics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-neutral-500 mb-1">Total Claims</div>
          <div className="text-2xl font-bold">{analyticsData.totalClaims.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-neutral-500 mb-1">Most Active Day</div>
          <div className="text-lg font-semibold">
            {formatMostActiveDay(analyticsData.mostActiveDay.date)}
          </div>
          {analyticsData.mostActiveDay.date && (
            <div className="text-sm text-neutral-500">
              {analyticsData.mostActiveDay.count.toLocaleString()} claims
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-neutral-500 mb-1">Top Claim Method</div>
          <div className="text-lg font-semibold">
            {analyticsData.topClaimMethod.method || 'None'}
          </div>
          {analyticsData.topClaimMethod.method && (
            <div className="text-sm text-neutral-500">
              {analyticsData.topClaimMethod.percentage.toFixed(0)}% of claims (
              {analyticsData.topClaimMethod.count.toLocaleString()})
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Bar chart */}
        <div>
          <h3 className="text-base font-medium mb-4">Claims Over Time</h3>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Claims" />
                </RechartsBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-neutral-500">Insufficient data for chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Pie chart */}
        <div>
          <h3 className="text-base font-medium mb-4">Claim Methods</h3>
          <div className="h-64">
            {analyticsData.claimMethods.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.claimMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="method"
                  >
                    {analyticsData.claimMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-neutral-500">Insufficient data for chart</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
