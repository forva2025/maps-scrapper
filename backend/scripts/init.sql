-- Initialize PostgreSQL database for Super MapScraper
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE mapscraper'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mapscraper')\gexec

-- Connect to the mapscraper database
\c mapscraper;

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram extension for text similarity
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a user for the application (optional)
-- CREATE USER mapscraper_user WITH PASSWORD 'mapscraper_password';
-- GRANT ALL PRIVILEGES ON DATABASE mapscraper TO mapscraper_user;