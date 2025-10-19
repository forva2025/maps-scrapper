const axios = require('axios');
const logger = require('../utils/logger');
const { query } = require('../config/database');

class PlacesService {
  constructor() {
    this.googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    this.bingApiKey = process.env.BING_MAPS_API_KEY;
    this.yelpApiKey = process.env.YELP_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  async geocodeLocation(location) {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: location,
          key: this.googleApiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id
        };
      }

      throw new Error(`Geocoding failed: ${response.data.status}`);
    } catch (error) {
      logger.error('Geocoding error:', error);
      throw error;
    }
  }

  async searchNearbyPlaces(lat, lng, radius, query, type = null) {
    try {
      const params = {
        location: `${lat},${lng}`,
        radius: radius,
        key: this.googleApiKey
      };

      if (query) {
        params.keyword = query;
      }

      if (type) {
        params.type = type;
      }

      const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
        params
      });

      if (response.data.status === 'OK') {
        return {
          results: response.data.results,
          next_page_token: response.data.next_page_token
        };
      }

      throw new Error(`Places search failed: ${response.data.status}`);
    } catch (error) {
      logger.error('Places search error:', error);
      throw error;
    }
  }

  async searchTextPlaces(query, location = null) {
    try {
      const params = {
        query: query,
        key: this.googleApiKey
      };

      if (location) {
        params.location = location;
      }

      const response = await axios.get(`${this.baseUrl}/textsearch/json`, {
        params
      });

      if (response.data.status === 'OK') {
        return {
          results: response.data.results,
          next_page_token: response.data.next_page_token
        };
      }

      throw new Error(`Text search failed: ${response.data.status}`);
    } catch (error) {
      logger.error('Text search error:', error);
      throw error;
    }
  }

  async getNextPageResults(nextPageToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
        params: {
          pagetoken: nextPageToken,
          key: this.googleApiKey
        }
      });

      if (response.data.status === 'OK') {
        return {
          results: response.data.results,
          next_page_token: response.data.next_page_token
        };
      }

      throw new Error(`Next page search failed: ${response.data.status}`);
    } catch (error) {
      logger.error('Next page search error:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId) {
    try {
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,rating,user_ratings_total,formatted_phone_number,website,price_level,types',
          key: this.googleApiKey
        }
      });

      if (response.data.status === 'OK') {
        return response.data.result;
      }

      throw new Error(`Place details failed: ${response.data.status}`);
    } catch (error) {
      logger.error('Place details error:', error);
      throw error;
    }
  }

  async performGridSearch(lat, lng, radius, queries, searchId) {
    const gridSize = 0.01; // ~1km grid cells
    const results = new Set();
    const processedPlaces = new Set();

    // Calculate grid bounds
    const latStep = gridSize;
    const lngStep = gridSize;

    const startLat = lat - (radius / 111000); // Rough conversion from meters to degrees
    const endLat = lat + (radius / 111000);
    const startLng = lng - (radius / (111000 * Math.cos(lat * Math.PI / 180)));
    const endLng = lng + (radius / (111000 * Math.cos(lat * Math.PI / 180)));

    for (let currentLat = startLat; currentLat <= endLat; currentLat += latStep) {
      for (let currentLng = startLng; currentLng <= endLng; currentLng += lngStep) {
        for (const query of queries) {
          try {
            const searchResults = await this.searchNearbyPlaces(
              currentLat, 
              currentLng, 
              Math.min(radius, 5000), // Google Places API max radius is 50000m
              query
            );

            for (const place of searchResults.results) {
              if (!processedPlaces.has(place.place_id)) {
                processedPlaces.add(place.place_id);
                
                // Check for duplicates in database
                const duplicateId = await this.findDuplicateBusiness(
                  place.name,
                  place.formatted_phone_number,
                  place.geometry.location.lat,
                  place.geometry.location.lng,
                  searchId
                );

                if (!duplicateId) {
                  await this.saveBusiness(place, searchId);
                  results.add(place.place_id);
                }
              }
            }

            // Handle pagination
            if (searchResults.next_page_token) {
              await this.processPagination(searchResults.next_page_token, processedPlaces, searchId, results);
            }

            // Rate limiting - wait between requests
            await new Promise(resolve => setTimeout(resolve, 100));

          } catch (error) {
            logger.error(`Grid search error at ${currentLat}, ${currentLng}:`, error);
          }
        }
      }
    }

    return Array.from(results);
  }

  async processPagination(nextPageToken, processedPlaces, searchId, results) {
    try {
      // Wait for next_page_token to become valid (Google requires this)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const searchResults = await this.getNextPageResults(nextPageToken);

      for (const place of searchResults.results) {
        if (!processedPlaces.has(place.place_id)) {
          processedPlaces.add(place.place_id);
          
          const duplicateId = await this.findDuplicateBusiness(
            place.name,
            place.formatted_phone_number,
            place.geometry.location.lat,
            place.geometry.location.lng,
            searchId
          );

          if (!duplicateId) {
            await this.saveBusiness(place, searchId);
            results.add(place.place_id);
          }
        }
      }

      // Continue pagination if there's another page
      if (searchResults.next_page_token) {
        await this.processPagination(searchResults.next_page_token, processedPlaces, searchId, results);
      }

    } catch (error) {
      logger.error('Pagination processing error:', error);
    }
  }

  async findDuplicateBusiness(name, phone, lat, lng, searchId) {
    try {
      const result = await query(
        'SELECT find_duplicate_businesses($1, $2, $3, $4, $5) as duplicate_id',
        [name, phone, lat, lng, searchId]
      );

      return result.rows[0].duplicate_id;
    } catch (error) {
      logger.error('Duplicate detection error:', error);
      return null;
    }
  }

  async saveBusiness(place, searchId) {
    try {
      const addressComponents = this.parseAddressComponents(place.vicinity || '');
      
      await query(
        `INSERT INTO businesses (
          search_id, name, address, city, state, country, postal_code,
          phone, website, rating, user_ratings_total, price_level,
          place_id, google_place_id, location, raw_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          searchId,
          place.name,
          place.vicinity,
          addressComponents.city,
          addressComponents.state,
          addressComponents.country,
          addressComponents.postalCode,
          place.formatted_phone_number,
          place.website,
          place.rating,
          place.user_ratings_total,
          place.price_level,
          place.place_id,
          place.place_id,
          `POINT(${place.geometry.location.lng} ${place.geometry.location.lat})`,
          JSON.stringify(place)
        ]
      );

      logger.debug(`Saved business: ${place.name}`);
    } catch (error) {
      logger.error('Error saving business:', error);
      throw error;
    }
  }

  parseAddressComponents(vicinity) {
    // Simple address parsing - in production, you might want to use a more sophisticated approach
    const parts = vicinity.split(',').map(part => part.trim());
    
    return {
      city: parts[0] || '',
      state: parts[1] || '',
      country: parts[2] || '',
      postalCode: ''
    };
  }
}

// Export singleton instance
const placesService = new PlacesService();

// Export individual functions for backward compatibility
const geocodeLocation = (location) => placesService.geocodeLocation(location);
const searchPlaces = (lat, lng, radius, query, type) => placesService.searchNearbyPlaces(lat, lng, radius, query, type);

module.exports = {
  PlacesService,
  placesService,
  geocodeLocation,
  searchPlaces
};