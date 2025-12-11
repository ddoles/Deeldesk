-- ============================================================================
-- Deeldesk.ai Database Initialization Script
-- ============================================================================
-- This script runs automatically when the PostgreSQL container starts
-- for the first time. It enables required extensions.
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector similarity search (pgvector)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enable trigram similarity for full-text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verify extensions are installed
DO $$
BEGIN
  RAISE NOTICE 'Installed extensions:';
  RAISE NOTICE '  - uuid-ossp: %', (SELECT installed_version FROM pg_available_extensions WHERE name = 'uuid-ossp');
  RAISE NOTICE '  - vector: %', (SELECT installed_version FROM pg_available_extensions WHERE name = 'vector');
  RAISE NOTICE '  - pg_trgm: %', (SELECT installed_version FROM pg_available_extensions WHERE name = 'pg_trgm');
END $$;

-- Create a test to verify vector extension works
DO $$
BEGIN
  PERFORM '[1,2,3]'::vector;
  RAISE NOTICE 'Vector extension working correctly!';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Vector extension is not working properly: %', SQLERRM;
END $$;
