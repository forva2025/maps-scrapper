const { connectDB, query } = require('../config/database');
const logger = require('../utils/logger');

const sampleSearches = [
  {
    query: JSON.stringify(['restaurants in Nairobi', 'hotels in Nairobi']),
    radius: 5000,
    status: 'completed',
    total_results: 150
  },
  {
    query: JSON.stringify(['clinics in Kampala']),
    radius: 3000,
    status: 'completed',
    total_results: 45
  },
  {
    query: JSON.stringify(['banks in Lagos']),
    radius: 10000,
    status: 'processing',
    total_results: 0
  }
];

const sampleBusinesses = [
  {
    name: 'Nairobi Restaurant',
    address: '123 Main Street, Nairobi',
    city: 'Nairobi',
    state: 'Nairobi County',
    country: 'Kenya',
    phone: '+254 20 123 4567',
    website: 'https://nairobirestaurant.com',
    rating: 4.5,
    user_ratings_total: 150,
    price_level: 2,
    place_id: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA',
    google_place_id: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA',
    location: 'POINT(36.8219 -1.2921)',
    raw_data: JSON.stringify({
      name: 'Nairobi Restaurant',
      rating: 4.5,
      user_ratings_total: 150,
      price_level: 2
    })
  },
  {
    name: 'Kampala Medical Center',
    address: '456 Health Avenue, Kampala',
    city: 'Kampala',
    state: 'Central Region',
    country: 'Uganda',
    phone: '+256 41 234 5678',
    website: 'https://kampalamedical.com',
    rating: 4.2,
    user_ratings_total: 89,
    price_level: 1,
    place_id: 'ChIJKxjxuaN8fRcRqD5LQ2BZwok',
    google_place_id: 'ChIJKxjxuaN8fRcRqD5LQ2BZwok',
    location: 'POINT(32.5825 0.3476)',
    raw_data: JSON.stringify({
      name: 'Kampala Medical Center',
      rating: 4.2,
      user_ratings_total: 89,
      price_level: 1
    })
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    logger.info('Starting database seeding...');

    // Clear existing data
    await query('DELETE FROM businesses');
    await query('DELETE FROM searches');
    await query('DELETE FROM analytics');

    // Insert sample searches
    for (const search of sampleSearches) {
      const result = await query(
        'INSERT INTO searches (query, radius, status, total_results, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id',
        [search.query, search.radius, search.status, search.total_results]
      );
      
      const searchId = result.rows[0].id;
      logger.info(`Created search: ${searchId}`);

      // Insert sample businesses for completed searches
      if (search.status === 'completed') {
        for (const business of sampleBusinesses) {
          await query(
            `INSERT INTO businesses (
              search_id, name, address, city, state, country, phone, website,
              rating, user_ratings_total, price_level, place_id, google_place_id,
              location, raw_data, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())`,
            [
              searchId,
              business.name,
              business.address,
              business.city,
              business.state,
              business.country,
              business.phone,
              business.website,
              business.rating,
              business.user_ratings_total,
              business.price_level,
              business.place_id,
              business.google_place_id,
              business.location,
              business.raw_data
            ]
          );
        }
        logger.info(`Added ${sampleBusinesses.length} businesses to search ${searchId}`);
      }
    }

    // Insert sample analytics
    const analyticsEvents = [
      {
        event_type: 'search_started',
        metadata: JSON.stringify({ queries: ['restaurants in Nairobi'], radius: 5000 })
      },
      {
        event_type: 'search_completed',
        metadata: JSON.stringify({ totalResults: 150, queries: ['restaurants in Nairobi'] })
      },
      {
        event_type: 'export_csv',
        metadata: JSON.stringify({ totalRecords: 150 })
      }
    ];

    for (const event of analyticsEvents) {
      await query(
        'INSERT INTO analytics (event_type, metadata, created_at) VALUES ($1, $2, NOW())',
        [event.event_type, event.metadata]
      );
    }

    logger.info('Database seeding completed successfully');

  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };