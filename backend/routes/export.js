const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { Parser } = require('json2csv');
const logger = require('../utils/logger');

const router = express.Router();

// Export search results to CSV
router.post('/csv', [
  body('searchId').isUUID().withMessage('Valid search ID is required'),
  body('filters').optional().isObject().withMessage('Filters must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { searchId, filters = {} } = req.body;

    // Verify search exists
    const searchResult = await query(
      'SELECT * FROM searches WHERE id = $1',
      [searchId]
    );

    if (searchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Search not found' });
    }

    // Build query with filters
    let whereConditions = ['search_id = $1'];
    let queryParams = [searchId];
    let paramIndex = 2;

    if (filters.minRating !== undefined) {
      whereConditions.push(`rating >= $${paramIndex}`);
      queryParams.push(filters.minRating);
      paramIndex++;
    }

    if (filters.maxRating !== undefined) {
      whereConditions.push(`rating <= $${paramIndex}`);
      queryParams.push(filters.maxRating);
      paramIndex++;
    }

    if (filters.city) {
      whereConditions.push(`LOWER(city) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${filters.city}%`);
      paramIndex++;
    }

    if (filters.state) {
      whereConditions.push(`LOWER(state) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${filters.state}%`);
      paramIndex++;
    }

    if (filters.country) {
      whereConditions.push(`LOWER(country) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${filters.country}%`);
      paramIndex++;
    }

    if (filters.hasPhone) {
      whereConditions.push(`phone IS NOT NULL AND phone != ''`);
    }

    if (filters.hasWebsite) {
      whereConditions.push(`website IS NOT NULL AND website != ''`);
    }

    if (filters.priceLevel !== undefined) {
      whereConditions.push(`price_level = $${paramIndex}`);
      queryParams.push(filters.priceLevel);
      paramIndex++;
    }

    if (filters.keyword) {
      whereConditions.push(`(LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(address) LIKE LOWER($${paramIndex}))`);
      queryParams.push(`%${filters.keyword}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get all matching businesses
    const businessesResult = await query(
      `SELECT name, address, city, state, country, postal_code, phone, website, 
              rating, user_ratings_total, price_level, place_id,
              ST_X(location) as longitude, ST_Y(location) as latitude,
              created_at
       FROM businesses 
       WHERE ${whereClause}
       ORDER BY name`,
      queryParams
    );

    // Convert to CSV
    const fields = [
      { label: 'Name', value: 'name' },
      { label: 'Address', value: 'address' },
      { label: 'City', value: 'city' },
      { label: 'State', value: 'state' },
      { label: 'Country', value: 'country' },
      { label: 'Postal Code', value: 'postal_code' },
      { label: 'Phone', value: 'phone' },
      { label: 'Website', value: 'website' },
      { label: 'Rating', value: 'rating' },
      { label: 'Total Ratings', value: 'user_ratings_total' },
      { label: 'Price Level', value: 'price_level' },
      { label: 'Place ID', value: 'place_id' },
      { label: 'Latitude', value: 'latitude' },
      { label: 'Longitude', value: 'longitude' },
      { label: 'Found Date', value: 'created_at' }
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(businessesResult.rows);

    // Set headers for file download
    const filename = `mapscraper-results-${searchId}-${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Log export analytics
    await query(
      'INSERT INTO analytics (event_type, search_id, metadata) VALUES ($1, $2, $3)',
      ['export_csv', searchId, JSON.stringify({ 
        totalRecords: businessesResult.rows.length, 
        filters 
      })]
    );

    res.send(csv);

  } catch (error) {
    logger.error('CSV export error:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// Export search results to JSON
router.post('/json', [
  body('searchId').isUUID().withMessage('Valid search ID is required'),
  body('filters').optional().isObject().withMessage('Filters must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { searchId, filters = {} } = req.body;

    // Verify search exists
    const searchResult = await query(
      'SELECT * FROM searches WHERE id = $1',
      [searchId]
    );

    if (searchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Search not found' });
    }

    // Build query with filters (same logic as CSV export)
    let whereConditions = ['search_id = $1'];
    let queryParams = [searchId];
    let paramIndex = 2;

    if (filters.minRating !== undefined) {
      whereConditions.push(`rating >= $${paramIndex}`);
      queryParams.push(filters.minRating);
      paramIndex++;
    }

    if (filters.maxRating !== undefined) {
      whereConditions.push(`rating <= $${paramIndex}`);
      queryParams.push(filters.maxRating);
      paramIndex++;
    }

    if (filters.city) {
      whereConditions.push(`LOWER(city) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${filters.city}%`);
      paramIndex++;
    }

    if (filters.state) {
      whereConditions.push(`LOWER(state) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${filters.state}%`);
      paramIndex++;
    }

    if (filters.country) {
      whereConditions.push(`LOWER(country) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${filters.country}%`);
      paramIndex++;
    }

    if (filters.hasPhone) {
      whereConditions.push(`phone IS NOT NULL AND phone != ''`);
    }

    if (filters.hasWebsite) {
      whereConditions.push(`website IS NOT NULL AND website != ''`);
    }

    if (filters.priceLevel !== undefined) {
      whereConditions.push(`price_level = $${paramIndex}`);
      queryParams.push(filters.priceLevel);
      paramIndex++;
    }

    if (filters.keyword) {
      whereConditions.push(`(LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(address) LIKE LOWER($${paramIndex}))`);
      queryParams.push(`%${filters.keyword}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Get all matching businesses
    const businessesResult = await query(
      `SELECT name, address, city, state, country, postal_code, phone, website, 
              rating, user_ratings_total, price_level, place_id,
              ST_X(location) as longitude, ST_Y(location) as latitude,
              created_at, raw_data
       FROM businesses 
       WHERE ${whereClause}
       ORDER BY name`,
      queryParams
    );

    // Prepare JSON response
    const exportData = {
      searchId,
      exportDate: new Date().toISOString(),
      totalRecords: businessesResult.rows.length,
      filters,
      searchInfo: {
        query: JSON.parse(searchResult.rows[0].query),
        radius: searchResult.rows[0].radius,
        createdAt: searchResult.rows[0].created_at,
        completedAt: searchResult.rows[0].completed_at
      },
      businesses: businessesResult.rows.map(row => ({
        name: row.name,
        address: row.address,
        city: row.city,
        state: row.state,
        country: row.country,
        postalCode: row.postal_code,
        phone: row.phone,
        website: row.website,
        rating: row.rating,
        totalRatings: row.user_ratings_total,
        priceLevel: row.price_level,
        placeId: row.place_id,
        coordinates: {
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude)
        },
        foundDate: row.created_at,
        rawData: row.raw_data
      }))
    };

    // Set headers for file download
    const filename = `mapscraper-results-${searchId}-${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');

    // Log export analytics
    await query(
      'INSERT INTO analytics (event_type, search_id, metadata) VALUES ($1, $2, $3)',
      ['export_json', searchId, JSON.stringify({ 
        totalRecords: businessesResult.rows.length, 
        filters 
      })]
    );

    res.json(exportData);

  } catch (error) {
    logger.error('JSON export error:', error);
    res.status(500).json({ error: 'Failed to export JSON' });
  }
});

// Get export statistics
router.get('/stats/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM businesses WHERE search_id = $1',
      [searchId]
    );

    // Get rating distribution
    const ratingResult = await query(
      `SELECT 
        CASE 
          WHEN rating >= 4.5 THEN '4.5-5.0'
          WHEN rating >= 4.0 THEN '4.0-4.4'
          WHEN rating >= 3.5 THEN '3.5-3.9'
          WHEN rating >= 3.0 THEN '3.0-3.4'
          WHEN rating >= 2.5 THEN '2.5-2.9'
          WHEN rating >= 2.0 THEN '2.0-2.4'
          WHEN rating >= 1.5 THEN '1.5-1.9'
          WHEN rating >= 1.0 THEN '1.0-1.4'
          ELSE 'No Rating'
        END as rating_range,
        COUNT(*) as count
       FROM businesses 
       WHERE search_id = $1 
       GROUP BY rating_range
       ORDER BY rating_range DESC`,
      [searchId]
    );

    // Get city distribution
    const cityResult = await query(
      `SELECT city, COUNT(*) as count 
       FROM businesses 
       WHERE search_id = $1 AND city IS NOT NULL AND city != ''
       GROUP BY city 
       ORDER BY count DESC 
       LIMIT 10`,
      [searchId]
    );

    // Get businesses with contact info
    const contactResult = await query(
      `SELECT 
        COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as with_phone,
        COUNT(CASE WHEN website IS NOT NULL AND website != '' THEN 1 END) as with_website,
        COUNT(CASE WHEN phone IS NOT NULL AND phone != '' AND website IS NOT NULL AND website != '' THEN 1 END) as with_both
       FROM businesses 
       WHERE search_id = $1`,
      [searchId]
    );

    res.json({
      searchId,
      totalBusinesses: parseInt(countResult.rows[0].total),
      ratingDistribution: ratingResult.rows,
      topCities: cityResult.rows,
      contactInfo: contactResult.rows[0]
    });

  } catch (error) {
    logger.error('Export stats error:', error);
    res.status(500).json({ error: 'Failed to get export statistics' });
  }
});

module.exports = router;