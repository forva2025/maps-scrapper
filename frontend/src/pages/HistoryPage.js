import { useState, useEffect, useCallback } from 'preact/hooks';
import { styled } from 'goober';
import { Link } from 'preact-router';

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

const HistoryContainer = styled('div')`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const SearchCard = styled('div')`
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.2s;
  
  &:hover {
    border-color: #2563eb;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
  }
`;

const SearchHeader = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const SearchTitle = styled('h3')`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const StatusBadge = styled('div')`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'completed':
        return `
          background-color: #dcfce7;
          color: #166534;
        `;
      case 'processing':
        return `
          background-color: #dbeafe;
          color: #1e40af;
        `;
      case 'failed':
        return `
          background-color: #fecaca;
          color: #dc2626;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #374151;
        `;
    }
  }}
`;

const SearchInfo = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled('span')`
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InfoValue = styled('span')`
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: 500;
`;

const SearchActions = styled('div')`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ActionButton = styled(Link)`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
  
  &.primary {
    background-color: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
    
    &:hover {
      background-color: #1d4ed8;
    }
  }
`;

const EmptyState = styled('div')`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #374151;
  }
  
  p {
    font-size: 0.875rem;
    margin-bottom: 2rem;
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

const FilterContainer = styled('div')`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
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

export function HistoryPage() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchSearches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/search/history');
      
      if (!response.ok) {
        throw new Error('Failed to fetch search history');
      }
      
      const data = await response.json();
      setSearches(data.searches || []);
    } catch (error) {
      console.error('Error fetching search history:', error);
      window.addToast?.('Failed to load search history', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  const filteredSearches = searches.filter(search => {
    if (filter === 'all') return true;
    return search.status === filter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatQueries = (queries) => {
    if (Array.isArray(queries)) {
      return queries.join(', ');
    }
    return queries || 'Unknown';
  };

  if (loading) {
    return (
      <PageContainer>
        <PageHeader>
          <Title>Search History</Title>
          <Subtitle>View and manage your previous searches</Subtitle>
        </PageHeader>
        
        <HistoryContainer>
          <LoadingSpinner>
            <div className="spinner" />
          </LoadingSpinner>
        </HistoryContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <Title>Search History</Title>
        <Subtitle>View and manage your previous searches</Subtitle>
      </PageHeader>

      <HistoryContainer>
        <FilterContainer>
          <FilterSelect
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Searches</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </FilterSelect>
          
          <div style={{ marginLeft: 'auto', fontSize: '0.875rem', color: '#6b7280' }}>
            {filteredSearches.length} of {searches.length} searches
          </div>
        </FilterContainer>

        {filteredSearches.length === 0 ? (
          <EmptyState>
            <h3>No Searches Found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't performed any searches yet. Start your first search to see results here."
                : `No searches found with status "${filter}".`
              }
            </p>
            {filter === 'all' && (
              <ActionButton href="/" className="primary">
                🔍 Start New Search
              </ActionButton>
            )}
          </EmptyState>
        ) : (
          filteredSearches.map((search) => (
            <SearchCard key={search.id}>
              <SearchHeader>
                <SearchTitle>
                  {formatQueries(search.query)}
                </SearchTitle>
                <StatusBadge status={search.status}>
                  {search.status?.charAt(0).toUpperCase() + search.status?.slice(1)}
                </StatusBadge>
              </SearchHeader>

              <SearchInfo>
                <InfoItem>
                  <InfoLabel>Search ID</InfoLabel>
                  <InfoValue>{search.id.slice(0, 8)}...</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Radius</InfoLabel>
                  <InfoValue>{search.radius}m</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Results</InfoLabel>
                  <InfoValue>{search.actual_results || search.total_results || 0}</InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel>Created</InfoLabel>
                  <InfoValue>{formatDate(search.created_at)}</InfoValue>
                </InfoItem>
                {search.completed_at && (
                  <InfoItem>
                    <InfoLabel>Completed</InfoLabel>
                    <InfoValue>{formatDate(search.completed_at)}</InfoValue>
                  </InfoItem>
                )}
              </SearchInfo>

              <SearchActions>
                <ActionButton href={`/results/${search.id}`} className="primary">
                  📊 View Results
                </ActionButton>
                {search.status === 'completed' && (
                  <>
                    <ActionButton href={`/results/${search.id}`}>
                      📄 Export CSV
                    </ActionButton>
                    <ActionButton href={`/results/${search.id}`}>
                      📋 Export JSON
                    </ActionButton>
                  </>
                )}
              </SearchActions>
            </SearchCard>
          ))
        )}
      </HistoryContainer>
    </PageContainer>
  );
}