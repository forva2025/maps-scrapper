import { useState, useCallback } from 'preact/hooks';
import { styled } from 'goober';
import { SearchForm } from '../components/SearchForm';
import { SearchResults } from '../components/SearchResults';
import { MapPreview } from '../components/MapPreview';
import { LoadingSpinner } from '../components/LoadingSpinner';

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
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled('p')`
  font-size: 1.125rem;
  color: #6b7280;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const ContentGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const SearchSection = styled('div')`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const MapSection = styled('div')`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 1rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  min-height: 400px;
`;

const SectionTitle = styled('h2')`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusCard = styled('div')`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
`;

const StatusHeader = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StatusTitle = styled('h3')`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
`;

const StatusBadge = styled('div')`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status) {
      case 'pending':
        return `
          background-color: #fef3c7;
          color: #92400e;
        `;
      case 'processing':
        return `
          background-color: #dbeafe;
          color: #1e40af;
        `;
      case 'completed':
        return `
          background-color: #dcfce7;
          color: #166534;
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

const ProgressBar = styled('div')`
  width: 100%;
  height: 8px;
  background-color: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressFill = styled('div')`
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #1d4ed8);
  border-radius: 4px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const StatusInfo = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  font-size: 0.875rem;
`;

const InfoItem = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled('span')`
  color: #6b7280;
  font-weight: 500;
`;

const InfoValue = styled('span')`
  color: #1f2937;
  font-weight: 600;
`;

export function SearchPage() {
  const [searchState, setSearchState] = useState({
    isSearching: false,
    searchId: null,
    status: null,
    progress: 0,
    totalResults: 0,
    currentQuery: '',
    queries: []
  });

  const [results, setResults] = useState([]);
  const [mapCenter, setMapCenter] = useState([0, 0]);
  const [mapZoom, setMapZoom] = useState(2);

  const handleSearchStart = useCallback(async (searchData) => {
    try {
      setSearchState(prev => ({
        ...prev,
        isSearching: true,
        status: 'pending',
        progress: 0,
        totalResults: 0,
        queries: searchData.queries
      }));

      const response = await fetch('/api/search/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) {
        throw new Error('Failed to start search');
      }

      const data = await response.json();
      setSearchState(prev => ({
        ...prev,
        searchId: data.searchId,
        status: data.status
      }));

      // Start polling for status updates
      pollSearchStatus(data.searchId);

    } catch (error) {
      console.error('Search start error:', error);
      window.addToast?.('Failed to start search. Please try again.', 'error');
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
        status: 'failed'
      }));
    }
  }, []);

  const pollSearchStatus = useCallback(async (searchId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/search/status/${searchId}`);
        if (!response.ok) {
          throw new Error('Failed to get search status');
        }

        const data = await response.json();
        
        setSearchState(prev => ({
          ...prev,
          status: data.status,
          totalResults: data.totalResults,
          progress: data.status === 'completed' ? 100 : 
                   data.status === 'processing' ? 50 : 0
        }));

        if (data.results && data.results.length > 0) {
          setResults(data.results);
          
          // Update map center to first result
          if (data.results[0].latitude && data.results[0].longitude) {
            setMapCenter([data.results[0].latitude, data.results[0].longitude]);
            setMapZoom(12);
          }
        }

        if (data.status === 'completed' || data.status === 'failed') {
          clearInterval(pollInterval);
          setSearchState(prev => ({
            ...prev,
            isSearching: false
          }));

          if (data.status === 'completed') {
            window.addToast?.(`Search completed! Found ${data.totalResults} results.`, 'success');
          } else {
            window.addToast?.('Search failed. Please try again.', 'error');
          }
        }

      } catch (error) {
        console.error('Status polling error:', error);
        clearInterval(pollInterval);
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          status: 'failed'
        }));
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup interval after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 300000);
  }, []);

  const handleExport = useCallback(async (format) => {
    if (!searchState.searchId) return;

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchId: searchState.searchId
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to export ${format}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mapscraper-results-${searchState.searchId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      window.addToast?.(`Results exported as ${format.toUpperCase()}`, 'success');

    } catch (error) {
      console.error('Export error:', error);
      window.addToast?.(`Failed to export ${format.toUpperCase()}`, 'error');
    }
  }, [searchState.searchId]);

  return (
    <PageContainer>
      <PageHeader>
        <Title>Super MapScraper</Title>
        <Subtitle>
          Extract unlimited business location data from Google Maps with advanced search capabilities. 
          No data limits, maximum coverage.
        </Subtitle>
      </PageHeader>

      {searchState.isSearching && (
        <StatusCard>
          <StatusHeader>
            <StatusTitle>Search in Progress</StatusTitle>
            <StatusBadge status={searchState.status}>
              {searchState.status?.charAt(0).toUpperCase() + searchState.status?.slice(1)}
            </StatusBadge>
          </StatusHeader>
          
          <ProgressBar>
            <ProgressFill progress={searchState.progress} />
          </ProgressBar>
          
          <StatusInfo>
            <InfoItem>
              <InfoLabel>Current Query</InfoLabel>
              <InfoValue>{searchState.currentQuery || 'Initializing...'}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Results Found</InfoLabel>
              <InfoValue>{searchState.totalResults}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Search ID</InfoLabel>
              <InfoValue>{searchState.searchId?.slice(0, 8)}...</InfoValue>
            </InfoItem>
          </StatusInfo>
        </StatusCard>
      )}

      <ContentGrid>
        <SearchSection>
          <SectionTitle>
            🔍 Search Configuration
          </SectionTitle>
          <SearchForm 
            onSearch={handleSearchStart}
            disabled={searchState.isSearching}
          />
        </SearchSection>

        <MapSection>
          <SectionTitle>
            🗺️ Map Preview
          </SectionTitle>
          <MapPreview 
            center={mapCenter}
            zoom={mapZoom}
            results={results}
          />
        </MapSection>
      </ContentGrid>

      {results.length > 0 && (
        <SearchResults 
          results={results}
          searchId={searchState.searchId}
          onExport={handleExport}
        />
      )}
    </PageContainer>
  );
}