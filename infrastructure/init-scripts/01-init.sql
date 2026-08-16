-- Optional initialization scripts for PostgreSQL
-- This file is executed on first container startup
-- Add any custom extensions or initial setup here

-- Enable UUID extension (Prisma uses gen_random_uuid() built-in in PG14+)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_trgm for future full-text search support
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
