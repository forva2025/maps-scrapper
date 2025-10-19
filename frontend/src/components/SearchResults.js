import { useState, useCallback } from 'preact/hooks';
import { styled } from 'goober';

const ResultsContainer = styled('div')`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
`;

const ResultsHeader = styled('div')`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ResultsTitle = styled('h2')`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ExportButtons = styled('div')`
  display: flex;
  gap: 0.5rem;
`;

const ExportButton = styled('button')`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FiltersContainer = styled('div')`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterInput = styled('input')`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
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

const ResultsTable = styled('div')`
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const Table = styled('table')`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
`;

const TableHeader = styled('thead')`
  background-color: #f9fafb;
`;

const TableRow = styled('tr')`
  border-bottom: 1px solid #e5e7eb;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableHeaderCell = styled('th')`
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const TableCell = styled('td')`
  padding: 0.75rem 1rem;
  color: #374151;
  vertical-align: top;
`;

const BusinessName = styled('div')`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const BusinessAddress = styled('div')`
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.4;
`;

const RatingContainer = styled('div')`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RatingStars = styled('div')`
  color: #fbbf24;
  font-size: 0.875rem;
`;

const RatingText = styled('span')`
  font-size: 0.75rem;
  color: #6b7280;
`;

const ContactInfo = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ContactLink = styled('a')`
  color: #2563eb;
  text-decoration: none;
  font-size: 0.75rem;
  
  &:hover {
    text-decoration: underline;
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
  }
`;

const Pagination = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const PaginationButton = styled('button')`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background-color: #f9fafb;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.active {
    background-color: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
  }
`;

export function SearchResults({ results, searchId, onExport }) {
  const [filteredResults, setFilteredResults] = useState(results);
  const [filters, setFilters] = useState({
    search: '',
    minRating: '',
    city: '',
    hasPhone: false,
    hasWebsite: false
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const itemsPerPage = 20;

  // Filter and sort results
  const applyFilters = useCallback(() => {
    let filtered = [...results];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(result => 
        result.name?.toLowerCase().includes(searchLower) ||
        result.address?.toLowerCase().includes(searchLower) ||
        result.city?.toLowerCase().includes(searchLower)
      );
    }

    // Apply rating filter
    if (filters.minRating) {
      filtered = filtered.filter(result => 
        result.rating && result.rating >= parseFloat(filters.minRating)
      );
    }

    // Apply city filter
    if (filters.city) {
      const cityLower = filters.city.toLowerCase();
      filtered = filtered.filter(result => 
        result.city?.toLowerCase().includes(cityLower)
      );
    }

    // Apply contact info filters
    if (filters.hasPhone) {
      filtered = filtered.filter(result => result.phone);
    }

    if (filters.hasWebsite) {
      filtered = filtered.filter(result => result.website);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'rating') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredResults(filtered);
    setCurrentPage(1);
  }, [results, filters, sortBy, sortOrder]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = useCallback((field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy]);

  const renderStars = (rating) => {
    if (!rating) return null;
    const stars = Math.round(rating);
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  const formatPhone = (phone) => {
    if (!phone) return null;
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = filteredResults.slice(startIndex, endIndex);

  if (results.length === 0) {
    return (
      <ResultsContainer>
        <EmptyState>
          <h3>No Results Yet</h3>
          <p>Start a search to see business listings here</p>
        </EmptyState>
      </ResultsContainer>
    );
  }

  return (
    <ResultsContainer>
      <ResultsHeader>
        <ResultsTitle>
          Search Results ({filteredResults.length} of {results.length})
        </ResultsTitle>
        <ExportButtons>
          <ExportButton onClick={() => onExport('csv')}>
            📄 Export CSV
          </ExportButton>
          <ExportButton onClick={() => onExport('json')}>
            📋 Export JSON
          </ExportButton>
        </ExportButtons>
      </ResultsHeader>

      <FiltersContainer>
        <FilterInput
          type="text"
          placeholder="Search businesses..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <FilterSelect
          value={filters.minRating}
          onChange={(e) => handleFilterChange('minRating', e.target.value)}
        >
          <option value="">All Ratings</option>
          <option value="4.5">4.5+ Stars</option>
          <option value="4.0">4.0+ Stars</option>
          <option value="3.5">3.5+ Stars</option>
          <option value="3.0">3.0+ Stars</option>
        </FilterSelect>
        <FilterInput
          type="text"
          placeholder="Filter by city..."
          value={filters.city}
          onChange={(e) => handleFilterChange('city', e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
          <input
            type="checkbox"
            checked={filters.hasPhone}
            onChange={(e) => handleFilterChange('hasPhone', e.target.checked)}
          />
          Has Phone
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
          <input
            type="checkbox"
            checked={filters.hasWebsite}
            onChange={(e) => handleFilterChange('hasWebsite', e.target.checked)}
          />
          Has Website
        </label>
      </FiltersContainer>

      <ResultsTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>
                <button
                  onClick={() => handleSort('name')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'inherit' }}
                >
                  Business Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </TableHeaderCell>
              <TableHeaderCell>Address</TableHeaderCell>
              <TableHeaderCell>
                <button
                  onClick={() => handleSort('rating')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'inherit' }}
                >
                  Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </TableHeaderCell>
              <TableHeaderCell>Contact</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {currentResults.map((result, index) => (
              <TableRow key={result.id || index}>
                <TableCell>
                  <BusinessName>{result.name || 'Unknown'}</BusinessName>
                  {result.place_id && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      ID: {result.place_id.slice(0, 8)}...
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <BusinessAddress>
                    {result.address || 'No address'}
                    {result.city && <div>{result.city}, {result.state} {result.country}</div>}
                  </BusinessAddress>
                </TableCell>
                <TableCell>
                  {result.rating ? (
                    <RatingContainer>
                      <RatingStars>{renderStars(result.rating)}</RatingStars>
                      <RatingText>
                        {result.rating} ({result.user_ratings_total || 0})
                      </RatingText>
                    </RatingContainer>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No rating</span>
                  )}
                </TableCell>
                <TableCell>
                  <ContactInfo>
                    {result.phone && (
                      <ContactLink href={`tel:${result.phone}`}>
                        📞 {formatPhone(result.phone)}
                      </ContactLink>
                    )}
                    {result.website && (
                      <ContactLink href={result.website} target="_blank" rel="noopener noreferrer">
                        🌐 Website
                      </ContactLink>
                    )}
                    {!result.phone && !result.website && (
                      <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>No contact info</span>
                    )}
                  </ContactInfo>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </ResultsTable>

      {totalPages > 1 && (
        <Pagination>
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </PaginationButton>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <PaginationButton
                key={page}
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? 'active' : ''}
              >
                {page}
              </PaginationButton>
            );
          })}
          
          <PaginationButton
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </PaginationButton>
        </Pagination>
      )}
    </ResultsContainer>
  );
}