import { styled } from 'goober';
import { Link } from 'preact-router';

const SidebarContainer = styled('aside')`
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: 280px;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  transform: translateX(${props => props.open ? '0' : '-100%'});
  transition: transform 0.3s ease-in-out;
  z-index: 50;
  overflow-y: auto;
  
  @media (min-width: 769px) {
    position: static;
    transform: none;
    width: 280px;
    flex-shrink: 0;
  }
`;

const SidebarContent = styled('div')`
  padding: 1.5rem;
`;

const SidebarSection = styled('div')`
  margin-bottom: 2rem;
`;

const SectionTitle = styled('h3')`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
`;

const SidebarLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #374151;
  border-radius: 0.5rem;
  transition: all 0.2s;
  margin-bottom: 0.25rem;
  
  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
  
  &.active {
    background-color: #eff6ff;
    color: #2563eb;
    font-weight: 500;
  }
`;

const LinkIcon = styled('div')`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
`;

const QuickStats = styled('div')`
  background-color: #f9fafb;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
`;

const StatItem = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled('span')`
  font-size: 0.875rem;
  color: #6b7280;
`;

const StatValue = styled('span')`
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
`;

const Overlay = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 40;
  display: ${props => props.open ? 'block' : 'none'};
  
  @media (min-width: 769px) {
    display: none;
  }
`;

export function Sidebar({ open, onClose }) {
  const [stats, setStats] = useState({
    totalSearches: 0,
    totalResults: 0,
    todaySearches: 0
  });

  useEffect(() => {
    // Fetch quick stats
    fetch('/api/analytics/dashboard?days=1')
      .then(res => res.json())
      .then(data => {
        setStats({
          totalSearches: data.summary?.totalSearches || 0,
          totalResults: data.summary?.totalBusinesses || 0,
          todaySearches: data.summary?.totalSearches || 0
        });
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  return (
    <>
      <Overlay open={open} onClick={onClose} />
      <SidebarContainer open={open}>
        <SidebarContent>
          <QuickStats>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1f2937' }}>
              Quick Stats
            </h4>
            <StatItem>
              <StatLabel>Today's Searches</StatLabel>
              <StatValue>{stats.todaySearches}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Total Results</StatLabel>
              <StatValue>{stats.totalResults}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Success Rate</StatLabel>
              <StatValue>98.5%</StatValue>
            </StatItem>
          </QuickStats>

          <SidebarSection>
            <SectionTitle>Navigation</SectionTitle>
            <SidebarLink href="/" activeClassName="active">
              <LinkIcon>🔍</LinkIcon>
              New Search
            </SidebarLink>
            <SidebarLink href="/history" activeClassName="active">
              <LinkIcon>📋</LinkIcon>
              Search History
            </SidebarLink>
            <SidebarLink href="/analytics" activeClassName="active">
              <LinkIcon>📊</LinkIcon>
              Analytics
            </SidebarLink>
          </SidebarSection>

          <SidebarSection>
            <SectionTitle>Recent Searches</SectionTitle>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', fontStyle: 'italic' }}>
              No recent searches
            </div>
          </SidebarSection>

          <SidebarSection>
            <SectionTitle>Quick Actions</SectionTitle>
            <SidebarLink href="/" onClick={() => window.addToast?.('Feature coming soon!', 'info')}>
              <LinkIcon>⚡</LinkIcon>
              Bulk Search
            </SidebarLink>
            <SidebarLink href="/" onClick={() => window.addToast?.('Feature coming soon!', 'info')}>
              <LinkIcon>📤</LinkIcon>
              Export All
            </SidebarLink>
            <SidebarLink href="/" onClick={() => window.addToast?.('Feature coming soon!', 'info')}>
              <LinkIcon>🔄</LinkIcon>
              Refresh Data
            </SidebarLink>
          </SidebarSection>
        </SidebarContent>
      </SidebarContainer>
    </>
  );
}