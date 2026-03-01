-- Add full-text search vector to Bookmark table
-- This must be run AFTER the Prisma migration that creates the Bookmark table

ALTER TABLE "Bookmark"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (to_tsvector('english', "content")) STORED;

CREATE INDEX "Bookmark_searchVector_idx" ON "Bookmark" USING GIN ("searchVector");
