import { useEffect, useRef, useState } from 'preact/hooks';
import { styled } from 'goober';

const MapContainer = styled('div')`
  width: 100%;
  height: 400px;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
  background-color: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MapPlaceholder = styled('div')`
  text-align: center;
  color: #6b7280;
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  
  p {
    font-size: 0.875rem;
  }
`;

const MapError = styled('div')`
  text-align: center;
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

const LoadingOverlay = styled('div')`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoadingSpinner = styled('div')`
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export function MapPreview({ center, zoom, results = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamically import Leaflet
        const L = await import('leaflet');
        
        // Fix for default markers in webpack
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Initialize map if not already done
        if (!mapInstance.current && mapRef.current) {
          mapInstance.current = L.map(mapRef.current).setView(center, zoom);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(mapInstance.current);
        }

        // Update map center if provided
        if (center[0] !== 0 && center[1] !== 0) {
          mapInstance.current.setView(center, zoom);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load map:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    loadLeaflet();
  }, [center, zoom]);

  useEffect(() => {
    if (!mapInstance.current || !results.length) return;

    const L = window.L;
    if (!L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstance.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    results.forEach((result, index) => {
      if (result.latitude && result.longitude) {
        const marker = L.marker([result.latitude, result.longitude])
          .addTo(mapInstance.current);
        
        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${result.name || 'Unknown'}</h4>
            ${result.address ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${result.address}</p>` : ''}
            ${result.rating ? `<p style="margin: 0 0 4px 0; font-size: 12px;">⭐ ${result.rating} (${result.user_ratings_total || 0} reviews)</p>` : ''}
            ${result.phone ? `<p style="margin: 0 0 4px 0; font-size: 12px;">📞 ${result.phone}</p>` : ''}
            ${result.website ? `<p style="margin: 0; font-size: 12px;"><a href="${result.website}" target="_blank" style="color: #2563eb;">🌐 Website</a></p>` : ''}
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markersRef.current.push(marker);
      }
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      mapInstance.current.fitBounds(group.getBounds().pad(0.1));
    }

  }, [results]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  if (error) {
    return (
      <MapContainer>
        <MapError>
          <h3>Map Error</h3>
          <p>{error}</p>
        </MapError>
      </MapContainer>
    );
  }

  if (!center || (center[0] === 0 && center[1] === 0)) {
    return (
      <MapContainer>
        <MapPlaceholder>
          <h3>🗺️ Map Preview</h3>
          <p>Start a search to see results on the map</p>
        </MapPlaceholder>
      </MapContainer>
    );
  }

  return (
    <MapContainer>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner />
        </LoadingOverlay>
      )}
    </MapContainer>
  );
}