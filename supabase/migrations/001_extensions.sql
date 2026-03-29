-- Rent and Drive LLC - Extensions Migration
-- Enable required PostgreSQL extensions

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- B-tree GiST for range types and exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- PostGIS for geospatial queries (vehicle locations, geofencing)
CREATE EXTENSION IF NOT EXISTS postgis;

-- pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Crypto functions for secure tokens
CREATE EXTENSION IF NOT EXISTS pgcrypto;
