const express = require('express');
const { query } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Get overall analytics dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Total searches
    const totalSearchesResult = await query(
      'SELECT COUNT(*) as total FROM searches WHERE created_at >= $1',
      [daysAgo]
    );

    // Completed searches
    const completedSearchesResult = await query(
      'SELECT COUNT(*) as total FROM searches WHERE status = $1 AND created_at >= $2',
      ['completed', daysAgo]
    );

    // Total businesses found
    const totalBusinessesResult = await query(
      `SELECT COUNT(*) as total 
       FROM businesses b
       JOIN searches s ON b.search_id = s.id
       WHERE s.created_at >= $1`,
      [daysAgo]
    );

    // Average results per search
    const avgResultsResult = await query(
      'SELECT AVG(total_results) as average FROM searches WHERE status = $1 AND created_at >= $2',
      ['completed', daysAgo]
    );

    // Searches by status
    const statusDistributionResult = await query(
      `SELECT status, COUNT(*) as count 
       FROM searches 
       WHERE created_at >= $1 
       GROUP BY status`,
      [daysAgo]
    );

    // Daily search activity
    const dailyActivityResult = await query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as searches,
        SUM(total_results) as total_results
       FROM searches 
       WHERE created_at >= $1 
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [daysAgo]
    );

    // Top search queries
    const topQueriesResult = await query(
      `SELECT query, COUNT(*) as count 
       FROM searches 
       WHERE created_at >= $1 
       GROUP BY query 
       ORDER BY count DESC 
       LIMIT 10`,
      [daysAgo]
    );

    // Export activity
    const exportActivityResult = await query(
      `SELECT event_type, COUNT(*) as count 
       FROM analytics 
       WHERE event_type IN ('export_csv', 'export_json') 
       AND created_at >= $1 
       GROUP BY event_type`,
      [daysAgo]
    );

    res.json({
      period: `${days} days`,
      summary: {
        totalSearches: parseInt(totalSearchesResult.rows[0].total),
        completedSearches: parseInt(completedSearchesResult.rows[0].total),
        totalBusinesses: parseInt(totalBusinessesResult.rows[0].total),
        averageResultsPerSearch: parseFloat(avgResultsResult.rows[0].average || 0)
      },
      statusDistribution: statusDistributionResult.rows,
      dailyActivity: dailyActivityResult.rows,
      topQueries: topQueriesResult.rows.map(row => ({
        ...row,
        query: JSON.parse(row.query)
      })),
      exportActivity: exportActivityResult.rows
    });

  } catch (error) {
    logger.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to get analytics data' });
  }
});

// Get search performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Average search duration
    const avgDurationResult = await query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration_seconds
       FROM searches 
       WHERE status = 'completed' 
       AND completed_at IS NOT NULL 
       AND created_at >= $1`,
      [daysAgo]
    );

    // Search success rate
    const successRateResult = await query(
      `SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(*) as total
       FROM searches 
       WHERE created_at >= $1`,
      [daysAgo]
    );

    // Results distribution
    const resultsDistributionResult = await query(
      `SELECT 
        CASE 
          WHEN total_results = 0 THEN '0'
          WHEN total_results BETWEEN 1 AND 10 THEN '1-10'
          WHEN total_results BETWEEN 11 AND 50 THEN '11-50'
          WHEN total_results BETWEEN 51 AND 100 THEN '51-100'
          WHEN total_results BETWEEN 101 AND 500 THEN '101-500'
          ELSE '500+'
        END as result_range,
        COUNT(*) as count
       FROM searches 
       WHERE status = 'completed' AND created_at >= $1
       GROUP BY result_range
       ORDER BY 
         CASE 
           WHEN result_range = '0' THEN 1
           WHEN result_range = '1-10' THEN 2
           WHEN result_range = '11-50' THEN 3
           WHEN result_range = '51-100' THEN 4
           WHEN result_range = '101-500' THEN 5
           ELSE 6
         END`,
      [daysAgo]
    );

    // Error analysis
    const errorAnalysisResult = await query(
      `SELECT 
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_searches,
        COUNT(CASE WHEN status = 'processing' AND created_at < NOW() - INTERVAL '1 hour' THEN 1 END) as stuck_searches
       FROM searches 
       WHERE created_at >= $1`,
      [daysAgo]
    );

    const successRate = successRateResult.rows[0].total > 0 
      ? (successRateResult.rows[0].successful / successRateResult.rows[0].total) * 100 
      : 0;

    res.json({
      period: `${days} days`,
      performance: {
        averageSearchDurationSeconds: parseFloat(avgDurationResult.rows[0].avg_duration_seconds || 0),
        successRate: Math.round(successRate * 100) / 100,
        failedSearches: parseInt(errorAnalysisResult.rows[0].failed_searches),
        stuckSearches: parseInt(errorAnalysisResult.rows[0].stuck_searches)
      },
      resultsDistribution: resultsDistributionResult.rows
    });

  } catch (error) {
    logger.error('Performance analytics error:', error);
    res.status(500).json({ error: 'Failed to get performance data' });
  }
});

// Get user activity analytics
router.get('/activity', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Event types distribution
    const eventTypesResult = await query(
      `SELECT event_type, COUNT(*) as count 
       FROM analytics 
       WHERE created_at >= $1 
       GROUP BY event_type 
       ORDER BY count DESC`,
      [daysAgo]
    );

    // Hourly activity pattern
    const hourlyActivityResult = await query(
      `SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as events
       FROM analytics 
       WHERE created_at >= $1 
       GROUP BY EXTRACT(HOUR FROM created_at)
       ORDER BY hour`,
      [daysAgo]
    );

    // User agent analysis (simplified)
    const userAgentResult = await query(
      `SELECT 
        CASE 
          WHEN user_agent LIKE '%Mobile%' THEN 'Mobile'
          WHEN user_agent LIKE '%Tablet%' THEN 'Tablet'
          ELSE 'Desktop'
        END as device_type,
        COUNT(*) as count
       FROM analytics 
       WHERE created_at >= $1 AND user_agent IS NOT NULL
       GROUP BY device_type`,
      [daysAgo]
    );

    res.json({
      period: `${days} days`,
      eventTypes: eventTypesResult.rows,
      hourlyActivity: hourlyActivityResult.rows,
      deviceTypes: userAgentResult.rows
    });

  } catch (error) {
    logger.error('Activity analytics error:', error);
    res.status(500).json({ error: 'Failed to get activity data' });
  }
});

// Log custom analytics event
router.post('/event', async (req, res) => {
  try {
    const { eventType, searchId, metadata } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    await query(
      'INSERT INTO analytics (event_type, search_id, user_agent, ip_address, metadata) VALUES ($1, $2, $3, $4, $5)',
      [
        eventType,
        searchId || null,
        req.get('User-Agent'),
        req.ip,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    res.json({ success: true, message: 'Event logged successfully' });

  } catch (error) {
    logger.error('Analytics event logging error:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
});

module.exports = router;