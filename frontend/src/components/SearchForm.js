import { useState, useCallback } from 'preact/hooks';
import { styled } from 'goober';

const Form = styled('form')`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled('div')`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled('label')`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const Input = styled('input')`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const Textarea = styled('textarea')`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const Select = styled('select')`
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  background-color: #ffffff;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  
  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const CheckboxGroup = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
`;

const CheckboxItem = styled('label')`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #2563eb;
  }
  
  &:disabled {
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const Button = styled('button')`
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8, #1e40af);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const HelpText = styled('p')`
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const ExampleQueries = styled('div')`
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 0.5rem;
`;

const ExampleTitle = styled('h4')`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const ExampleList = styled('ul')`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ExampleItem = styled('li')`
  font-size: 0.875rem;
  color: #6b7280;
  padding: 0.25rem 0;
  cursor: pointer;
  
  &:hover {
    color: #2563eb;
  }
  
  &::before {
    content: '• ';
    color: #9ca3af;
  }
`;

export function SearchForm({ onSearch, disabled = false }) {
  const [formData, setFormData] = useState({
    queries: [''],
    radius: 5000,
    providers: ['google']
  });

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleQueryChange = useCallback((index, value) => {
    setFormData(prev => ({
      ...prev,
      queries: prev.queries.map((query, i) => i === index ? value : query)
    }));
  }, []);

  const addQuery = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      queries: [...prev.queries, '']
    }));
  }, []);

  const removeQuery = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      queries: prev.queries.filter((_, i) => i !== index)
    }));
  }, []);

  const handleProviderChange = useCallback((provider, checked) => {
    setFormData(prev => ({
      ...prev,
      providers: checked 
        ? [...prev.providers, provider]
        : prev.providers.filter(p => p !== provider)
    }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    const validQueries = formData.queries.filter(query => query.trim());
    if (validQueries.length === 0) {
      window.addToast?.('Please enter at least one search query', 'warning');
      return;
    }

    onSearch({
      queries: validQueries,
      radius: formData.radius,
      providers: formData.providers
    });
  }, [formData, onSearch]);

  const exampleQueries = [
    'restaurants in Nairobi',
    'clinics in Kampala',
    'hotels in Lagos',
    'pharmacies in Accra',
    'banks in Cairo'
  ];

  const handleExampleClick = useCallback((example) => {
    setFormData(prev => ({
      ...prev,
      queries: [example]
    }));
  }, []);

  return (
    <Form onSubmit={handleSubmit}>
      <FormGroup>
        <Label>Search Queries</Label>
        <HelpText>
          Enter one or more search terms. Use "business type in location" format for best results.
        </HelpText>
        
        {formData.queries.map((query, index) => (
          <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(index, e.target.value)}
              placeholder="e.g., restaurants in Nairobi"
              disabled={disabled}
              style={{ flex: 1 }}
            />
            {formData.queries.length > 1 && (
              <button
                type="button"
                onClick={() => removeQuery(index)}
                disabled={disabled}
                style={{
                  padding: '0.5rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        
        <button
          type="button"
          onClick={addQuery}
          disabled={disabled}
          style={{
            padding: '0.5rem 1rem',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          + Add Another Query
        </button>

        <ExampleQueries>
          <ExampleTitle>Example Queries:</ExampleTitle>
          <ExampleList>
            {exampleQueries.map((example, index) => (
              <ExampleItem 
                key={index}
                onClick={() => !disabled && handleExampleClick(example)}
              >
                {example}
              </ExampleItem>
            ))}
          </ExampleList>
        </ExampleQueries>
      </FormGroup>

      <FormGroup>
        <Label>Search Radius (meters)</Label>
        <Select
          value={formData.radius}
          onChange={(e) => handleInputChange('radius', parseInt(e.target.value))}
          disabled={disabled}
        >
          <option value={1000}>1 km</option>
          <option value={2000}>2 km</option>
          <option value={5000}>5 km</option>
          <option value={10000}>10 km</option>
          <option value={20000}>20 km</option>
          <option value={50000}>50 km</option>
        </Select>
        <HelpText>
          Larger radius will find more results but may take longer to process.
        </HelpText>
      </FormGroup>

      <FormGroup>
        <Label>Data Providers</Label>
        <CheckboxGroup>
          <CheckboxItem>
            <input
              type="checkbox"
              checked={formData.providers.includes('google')}
              onChange={(e) => handleProviderChange('google', e.target.checked)}
              disabled={disabled}
            />
            Google Places
          </CheckboxItem>
          <CheckboxItem>
            <input
              type="checkbox"
              checked={formData.providers.includes('bing')}
              onChange={(e) => handleProviderChange('bing', e.target.checked)}
              disabled={disabled}
            />
            Bing Maps
          </CheckboxItem>
          <CheckboxItem>
            <input
              type="checkbox"
              checked={formData.providers.includes('yelp')}
              onChange={(e) => handleProviderChange('yelp', e.target.checked)}
              disabled={disabled}
            />
            Yelp
          </CheckboxItem>
          <CheckboxItem>
            <input
              type="checkbox"
              checked={formData.providers.includes('osm')}
              onChange={(e) => handleProviderChange('osm', e.target.checked)}
              disabled={disabled}
            />
            OpenStreetMap
          </CheckboxItem>
        </CheckboxGroup>
        <HelpText>
          Select which data sources to use. Google Places is recommended for best results.
        </HelpText>
      </FormGroup>

      <Button type="submit" disabled={disabled}>
        {disabled ? (
          <>
            <div className="spinner" />
            Searching...
          </>
        ) : (
          <>
            🔍 Start Search
          </>
        )}
      </Button>
    </Form>
  );
}