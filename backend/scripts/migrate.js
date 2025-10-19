const { connectDB, query } = require('../config/database');
const logger = require('../utils/logger');

const migrations = [
  {
    name: 'create_searches_table',
    sql: `
      CREATE TABLE IF NOT EXISTS searches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        query TEXT NOT NULL,
        location TEXT,
        radius INTEGER DEFAULT 5000,
        status VARCHAR(20) DEFAULT 'pending',
        total_results INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `
  },
  {
    name: 'create_businesses_table',
    sql: `
      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        search_id UUID REFERENCES searches(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        postal_code TEXT,
        phone TEXT,
        website TEXT,
        rating DECIMAL(2,1),
        user_ratings_total INTEGER,
        price_level INTEGER,
        place_id TEXT UNIQUE,
        google_place_id TEXT,
        bing_place_id TEXT,
        yelp_place_id TEXT,
        osm_place_id TEXT,
        location GEOMETRY(POINT, 4326),
        raw_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'create_businesses_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_businesses_search_id ON businesses(search_id);
      CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST(location);
      CREATE INDEX IF NOT EXISTS idx_businesses_name ON businesses(name);
      CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
      CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(rating);
      CREATE INDEX IF NOT EXISTS idx_businesses_place_id ON businesses(place_id);
      CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON businesses(created_at);
    `
  },
  {
    name: 'create_analytics_table',
    sql: `
      CREATE TABLE IF NOT EXISTS analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(50) NOT NULL,
        search_id UUID REFERENCES searches(id) ON DELETE SET NULL,
        user_agent TEXT,
        ip_address INET,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'create_analytics_indexes',
    sql: `
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_search_id ON analytics(search_id);
    `
  },
  {
    name: 'create_duplicate_detection_function',
    sql: `
      CREATE OR REPLACE FUNCTION find_duplicate_businesses(
        p_name TEXT,
        p_phone TEXT,
        p_lat DECIMAL,
        p_lng DECIMAL,
        p_search_id UUID
      ) RETURNS UUID AS $$
      DECLARE
        duplicate_id UUID;
        distance_threshold DECIMAL := 0.0005; -- ~50 meters
      BEGIN
        -- Check for exact phone match
        IF p_phone IS NOT NULL AND p_phone != '' THEN
          SELECT id INTO duplicate_id 
          FROM businesses 
          WHERE phone = p_phone 
            AND search_id = p_search_id 
          LIMIT 1;
          
          IF duplicate_id IS NOT NULL THEN
            RETURN duplicate_id;
          END IF;
        END IF;
        
        -- Check for name similarity and proximity
        IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
          SELECT id INTO duplicate_id 
          FROM businesses 
          WHERE search_id = p_search_id
            AND ST_DWithin(
              location, 
              ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), 
              distance_threshold
            )
            AND (
              LOWER(name) = LOWER(p_name) 
              OR SIMILARITY(name, p_name) > 0.8
            )
          LIMIT 1;
          
          IF duplicate_id IS NOT NULL THEN
            RETURN duplicate_id;
          END IF;
        END IF;
        
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `
  }
];

async function runMigrations() {
  try {
    await connectDB();
    logger.info('Starting database migrations...');
    
    for (const migration of migrations) {
      logger.info(`Running migration: ${migration.name}`);
      await query(migration.sql);
    }
    
    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };