import { useState, useEffect, useCallback } from 'preact/hooks';
import { styled } from 'goober';

const PageContainer = styled('div')`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled('div')`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled('h1')`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const Subtitle = styled('p')`
  font-size: 1.125rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const AnalyticsGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const AnalyticsCard = styled('div')`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const CardTitle = styled('h3')`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MetricGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
`;

const MetricItem = styled('div')`
  text-align: center;
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
`;

const MetricValue = styled('div')`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled('div')`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const ChartContainer = styled('div')`
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
`;

const ListContainer = styled('div')`
  max-height: 300px;
  overflow-y: auto;
`;

const ListItem = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ListLabel = styled('span')`
  font-size: 0.875rem;
  color: #374151;
`;

const ListValue = styled('span')`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
`;

const FilterContainer = styled('div')`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
  flex-wrap: wrap;
`;

const FilterSelect = styled('select')`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: #ffffff;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const LoadingSpinner = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled('div')`
  text-align: center;
  padding: 2rem;
  color: #dc2626;
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.875rem;
  }
`;

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, performanceRes, activityRes] = await Promise.all([
        fetch(`/api/analytics/dashboard?days=${timeRange}`),
        fetch(`/api/analytics/performance?days=${timeRange}`),
        fetch(`/api/analytics/activity?days=${timeRange}`)
      ]);

      if (!dashboardRes.ok || !performanceRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [dashboard, performanceData, activityData] = await Promise.all([
        dashboardRes.json(),
        performanceRes.json(),
        activityRes.json()
      ]);

      setAnalytics(dashboard);
      setPerformance(performanceData);
      setActivity(activityData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}m`;
    } else {
      return `${Math.round(seconds / 3600)}h`;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader>
          <Title>Analytics Dashboard</Title>
          <Subtitle>Monitor search performance and usage statistics</Subtitle>
        </PageHeader>
        
        <AnalyticsCard>
          <LoadingSpinner>
            <div className="spinner" />
          </LoadingSpinner>
        </AnalyticsCard>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader>
          <Title>Analytics Dashboard</Title>
          <Subtitle>Monitor search performance and usage statistics</Subtitle>
        </PageHeader>
        
        <AnalyticsCard>
          <ErrorMessage>
            <h3>Error Loading Analytics</h3>
            <p>{error}</p>
          </ErrorMessage>
        </AnalyticsCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>Analytics Dashboard</Title>
        <Subtitle>Monitor search performance and usage statistics</Subtitle>
      </PageHeader>

      <FilterContainer>
        <FilterSelect
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </FilterSelect>
      </FilterContainer>

      <AnalyticsGrid>
        {/* Summary Metrics */}
        <AnalyticsCard>
          <CardTitle>
            📊 Summary Metrics
          </CardTitle>
          <MetricGrid>
            <MetricItem>
              <MetricValue>{formatNumber(analytics?.summary?.totalSearches || 0)}</MetricValue>
              <MetricLabel>Total Searches</MetricLabel>
            </MetricItem>
            <MetricItem>
              <MetricValue>{formatNumber(analytics?.summary?.completedSearches || 0)}</MetricValue>
              <MetricLabel>Completed</MetricLabel>
            </MetricItem>
            <MetricItem>
              <MetricValue>{formatNumber(analytics?.summary?.totalBusinesses || 0)}</MetricValue>
              <MetricLabel>Businesses Found</MetricLabel>
            </MetricItem>
            <MetricItem>
              <MetricValue>{Math.round(analytics?.summary?.averageResultsPerSearch || 0)}</MetricValue>
              <MetricLabel>Avg Results</MetricLabel>
            </MetricItem>
          </MetricGrid>
        </AnalyticsCard>

        {/* Performance Metrics */}
        <AnalyticsCard>
          <CardTitle>
            ⚡ Performance
          </CardTitle>
          <MetricGrid>
            <MetricItem>
              <MetricValue>{formatDuration(performance?.performance?.averageSearchDurationSeconds || 0)}</MetricValue>
              <MetricLabel>Avg Duration</MetricLabel>
            </MetricItem>
            <MetricItem>
              <MetricValue>{performance?.performance?.successRate || 0}%</MetricValue>
              <MetricLabel>Success Rate</MetricLabel>
            </MetricItem>
            <MetricItem>
              <MetricValue>{performance?.performance?.failedSearches || 0}</MetricValue>
              <MetricLabel>Failed</MetricLabel>
            </MetricItem>
            <MetricItem>
              <MetricValue>{performance?.performance?.stuckSearches || 0}</MetricValue>
              <MetricLabel>Stuck</MetricLabel>
            </MetricItem>
          </MetricGrid>
        </AnalyticsCard>

        {/* Status Distribution */}
        <AnalyticsCard>
          <CardTitle>
            📈 Search Status
          </CardTitle>
          <ListContainer>
            {analytics?.statusDistribution?.map((status, index) => (
              <ListItem key={index}>
                <ListLabel>{status.status}</ListLabel>
                <ListValue>{status.count}</ListValue>
              </ListItem>
            ))}
          </ListContainer>
        </AnalyticsCard>

        {/* Top Queries */}
        <AnalyticsCard>
          <CardTitle>
            🔍 Top Queries
          </CardTitle>
          <ListContainer>
            {analytics?.topQueries?.slice(0, 5).map((query, index) => (
              <ListItem key={index}>
                <ListLabel>{Array.isArray(query.query) ? query.query.join(', ') : query.query}</ListLabel>
                <ListValue>{query.count}</ListValue>
              </ListItem>
            ))}
          </ListContainer>
        </AnalyticsCard>

        {/* Export Activity */}
        <AnalyticsCard>
          <CardTitle>
            📤 Export Activity
          </CardTitle>
          <ListContainer>
            {analytics?.exportActivity?.map((exportType, index) => (
              <ListItem key={index}>
                <ListLabel>{exportType.event_type.replace('export_', '').toUpperCase()}</ListLabel>
                <ListValue>{exportType.count}</ListValue>
              </ListItem>
            ))}
          </ListContainer>
        </AnalyticsCard>

        {/* Results Distribution */}
        <AnalyticsCard>
          <CardTitle>
            📊 Results Distribution
          </CardTitle>
          <ListContainer>
            {performance?.resultsDistribution?.map((range, index) => (
              <ListItem key={index}>
                <ListLabel>{range.result_range} results</ListLabel>
                <ListValue>{range.count}</ListValue>
              </ListItem>
            ))}
          </ListContainer>
        </AnalyticsCard>

        {/* Daily Activity Chart Placeholder */}
        <AnalyticsCard>
          <CardTitle>
            📅 Daily Activity
          </CardTitle>
          <ChartContainer>
            Chart visualization would go here
            <br />
            (Integration with Chart.js or similar)
          </ChartContainer>
        </AnalyticsCard>

        {/* Device Types */}
        <AnalyticsCard>
          <CardTitle>
            📱 Device Types
          </CardTitle>
          <ListContainer>
            {activity?.deviceTypes?.map((device, index) => (
              <ListItem key={index}>
                <ListLabel>{device.device_type}</ListLabel>
                <ListValue>{device.count}</ListValue>
              </ListItem>
            ))}
          </ListContainer>
        </AnalyticsCard>
      </AnalyticsGrid>
    </PageContainer>
  );
}