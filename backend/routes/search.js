const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { getRedis } = require('../config/redis');
const { Queue } = require('bullmq');
const logger = require('../utils/logger');
const { geocodeLocation, searchPlaces } = require('../services/placesService');

const router = express.Router();

// Initialize job queue
const searchQueue = new Queue('search-queue', {
  connection: getRedis(),
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Validation middleware
const validateSearchRequest = [
  body('queries').isArray({ min: 1, max: 10 }).withMessage('Queries must be an array with 1-10 items'),
  body('queries.*').isString().isLength({ min: 1, max: 200 }).withMessage('Each query must be 1-200 characters'),
  body('radius').optional().isInt({ min: 100, max: 50000 }).withMessage('Radius must be between 100-50000 meters'),
  body('providers').optional().isArray().withMessage('Providers must be an array'),
  body('providers.*').optional().isIn(['google', 'bing', 'yelp', 'osm']).withMessage('Invalid provider'),
];

// Start a new search
router.post('/start', validateSearchRequest, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { queries, radius = 5000, providers = ['google'] } = req.body;
    const searchId = uuidv4();

    // Create search record
    await query(
      'INSERT INTO searches (id, query, radius, status) VALUES ($1, $2, $3, $4)',
      [searchId, JSON.stringify(queries), radius, 'pending']
    );

    // Add job to queue
    await searchQueue.add('search-places', {
      searchId,
      queries,
      radius,
      providers,
    }, {
      jobId: searchId,
    });

    // Log analytics
    await query(
      'INSERT INTO analytics (event_type, search_id, metadata) VALUES ($1, $2, $3)',
      ['search_started', searchId, JSON.stringify({ queries, radius, providers })]
    );

    res.json({
      success: true,
      searchId,
      message: 'Search started successfully',
      status: 'pending'
    });

  } catch (error) {
    logger.error('Error starting search:', error);
    res.status(500).json({ error: 'Failed to start search' });
  }
});

// Get search status and results
router.get('/status/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;

    // Get search info
    const searchResult = await query(
      'SELECT * FROM searches WHERE id = $1',
      [searchId]
    );

    if (searchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Search not found' });
    }

    const search = searchResult.rows[0];

    // Get businesses count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM businesses WHERE search_id = $1',
      [searchId]
    );

    const totalResults = parseInt(countResult.rows[0].total);

    // Get sample results (first 10)
    const businessesResult = await query(
      `SELECT id, name, address, city, state, country, phone, website, 
              rating, user_ratings_total, price_level, place_id,
              ST_X(location) as longitude, ST_Y(location) as latitude,
              created_at
       FROM businesses 
       WHERE search_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [searchId]
    );

    res.json({
      searchId,
      status: search.status,
      query: JSON.parse(search.query),
      radius: search.radius,
      totalResults,
      results: businessesResult.rows,
      createdAt: search.created_at,
      updatedAt: search.updated_at,
      completedAt: search.completed_at
    });

  } catch (error) {
    logger.error('Error getting search status:', error);
    res.status(500).json({ error: 'Failed to get search status' });
  }
});

// Get all results for a search (paginated)
router.get('/results/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    const offset = (page - 1) * limit;
    const validSortColumns = ['name', 'rating', 'created_at', 'city'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM businesses WHERE search_id = $1',
      [searchId]
    );

    const totalResults = parseInt(countResult.rows[0].total);

    // Get paginated results
    const businessesResult = await query(
      `SELECT id, name, address, city, state, country, phone, website, 
              rating, user_ratings_total, price_level, place_id,
              ST_X(location) as longitude, ST_Y(location) as latitude,
              created_at
       FROM businesses 
       WHERE search_id = $1 
       ORDER BY ${sortColumn} ${order}
       LIMIT $2 OFFSET $3`,
      [searchId, limit, offset]
    );

    res.json({
      searchId,
      results: businessesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResults,
        pages: Math.ceil(totalResults / limit)
      }
    });

  } catch (error) {
    logger.error('Error getting search results:', error);
    res.status(500).json({ error: 'Failed to get search results' });
  }
});

// Search businesses with filters
router.post('/filter', async (req, res) => {
  try {
    const { searchId, filters = {} } = req.body;
    const { 
      minRating, 
      maxRating, 
      city, 
      state, 
      country, 
      hasPhone, 
      hasWebsite,
      priceLevel,
      keyword 
    } = filters;

    let whereConditions = ['search_id = $1'];
    let queryParams = [searchId];
    let paramIndex = 2;

    if (minRating !== undefined) {
      whereConditions.push(`rating >= $${paramIndex}`);
      queryParams.push(minRating);
      paramIndex++;
    }

    if (maxRating !== undefined) {
      whereConditions.push(`rating <= $${paramIndex}`);
      queryParams.push(maxRating);
      paramIndex++;
    }

    if (city) {
      whereConditions.push(`LOWER(city) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${city}%`);
      paramIndex++;
    }

    if (state) {
      whereConditions.push(`LOWER(state) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${state}%`);
      paramIndex++;
    }

    if (country) {
      whereConditions.push(`LOWER(country) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${country}%`);
      paramIndex++;
    }

    if (hasPhone) {
      whereConditions.push(`phone IS NOT NULL AND phone != ''`);
    }

    if (hasWebsite) {
      whereConditions.push(`website IS NOT NULL AND website != ''`);
    }

    if (priceLevel !== undefined) {
      whereConditions.push(`price_level = $${paramIndex}`);
      queryParams.push(priceLevel);
      paramIndex++;
    }

    if (keyword) {
      whereConditions.push(`(LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(address) LIKE LOWER($${paramIndex}))`);
      queryParams.push(`%${keyword}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const businessesResult = await query(
      `SELECT id, name, address, city, state, country, phone, website, 
              rating, user_ratings_total, price_level, place_id,
              ST_X(location) as longitude, ST_Y(location) as latitude,
              created_at
       FROM businesses 
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      queryParams
    );

    res.json({
      searchId,
      results: businessesResult.rows,
      total: businessesResult.rows.length,
      filters
    });

  } catch (error) {
    logger.error('Error filtering results:', error);
    res.status(500).json({ error: 'Failed to filter results' });
  }
});

// Get search history
router.get('/history', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const searchesResult = await query(
      `SELECT s.id, s.query, s.radius, s.status, s.total_results, 
              s.created_at, s.updated_at, s.completed_at,
              COUNT(b.id) as actual_results
       FROM searches s
       LEFT JOIN businesses b ON s.id = b.search_id
       GROUP BY s.id, s.query, s.radius, s.status, s.total_results, s.created_at, s.updated_at, s.completed_at
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      searches: searchesResult.rows.map(row => ({
        ...row,
        query: JSON.parse(row.query)
      }))
    });

  } catch (error) {
    logger.error('Error getting search history:', error);
    res.status(500).json({ error: 'Failed to get search history' });
  }
});

module.exports = router;