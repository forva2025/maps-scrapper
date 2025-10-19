const { Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const { query } = require('../config/database');
const { placesService } = require('../services/placesService');
const logger = require('../utils/logger');

let worker;

const startQueueWorker = () => {
  worker = new Worker('search-queue', async (job) => {
    const { searchId, queries, radius, providers } = job.data;
    
    logger.info(`Starting search job ${searchId}`, { queries, radius, providers });

    try {
      // Update search status to processing
      await query(
        'UPDATE searches SET status = $1, updated_at = NOW() WHERE id = $2',
        ['processing', searchId]
      );

      let totalResults = 0;

      for (const queryText of queries) {
        try {
          // Check if query contains location information
          if (queryText.toLowerCase().includes(' in ')) {
            // Extract location from query (e.g., "restaurants in Nairobi")
            const parts = queryText.split(' in ');
            const searchTerm = parts[0].trim();
            const location = parts[1].trim();

            // Geocode the location
            const geocodedLocation = await placesService.geocodeLocation(location);
            
            // Perform grid search
            const results = await placesService.performGridSearch(
              geocodedLocation.lat,
              geocodedLocation.lng,
              radius,
              [searchTerm],
              searchId
            );

            totalResults += results.length;
            logger.info(`Found ${results.length} results for "${searchTerm} in ${location}"`);

          } else {
            // Text search without specific location
            const searchResults = await placesService.searchTextPlaces(queryText);
            
            for (const place of searchResults.results) {
              // Check for duplicates
              const duplicateId = await placesService.findDuplicateBusiness(
                place.name,
                place.formatted_phone_number,
                place.geometry.location.lat,
                place.geometry.location.lng,
                searchId
              );

              if (!duplicateId) {
                await placesService.saveBusiness(place, searchId);
                totalResults++;
              }
            }

            // Handle pagination for text search
            if (searchResults.next_page_token) {
              await placesService.processPagination(
                searchResults.next_page_token,
                new Set(),
                searchId,
                new Set()
              );
            }

            logger.info(`Found ${searchResults.results.length} results for "${queryText}"`);
          }

          // Update progress
          await job.updateProgress({
            completed: queries.indexOf(queryText) + 1,
            total: queries.length,
            currentQuery: queryText,
            totalResults
          });

        } catch (error) {
          logger.error(`Error processing query "${queryText}":`, error);
          // Continue with other queries even if one fails
        }
      }

      // Update search status to completed
      await query(
        'UPDATE searches SET status = $1, total_results = $2, completed_at = NOW(), updated_at = NOW() WHERE id = $3',
        ['completed', totalResults, searchId]
      );

      // Log completion analytics
      await query(
        'INSERT INTO analytics (event_type, search_id, metadata) VALUES ($1, $2, $3)',
        ['search_completed', searchId, JSON.stringify({ totalResults, queries, radius, providers })]
      );

      logger.info(`Search job ${searchId} completed successfully with ${totalResults} results`);

      return {
        searchId,
        totalResults,
        status: 'completed'
      };

    } catch (error) {
      logger.error(`Search job ${searchId} failed:`, error);

      // Update search status to failed
      await query(
        'UPDATE searches SET status = $1, updated_at = NOW() WHERE id = $2',
        ['failed', searchId]
      );

      // Log failure analytics
      await query(
        'INSERT INTO analytics (event_type, search_id, metadata) VALUES ($1, $2, $3)',
        ['search_failed', searchId, JSON.stringify({ error: error.message })]
      );

      throw error;
    }
  }, {
    connection: getRedis(),
    concurrency: 3, // Process up to 3 jobs concurrently
  });

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed:`, err);
  });

  worker.on('error', (err) => {
    logger.error('Worker error:', err);
  });

  logger.info('Scraper worker started successfully');
  return worker;
};

const stopQueueWorker = async () => {
  if (worker) {
    await worker.close();
    logger.info('Scraper worker stopped');
  }
};

module.exports = {
  startQueueWorker,
  stopQueueWorker
};