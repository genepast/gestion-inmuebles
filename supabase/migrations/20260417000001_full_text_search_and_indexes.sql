-- Full-text search: computed tsvector column over title + description
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('spanish', coalesce(description, '')), 'B')
    ) STORED;

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_properties_search_vector
  ON properties USING gin(search_vector);

-- Indexes required by spec
CREATE INDEX IF NOT EXISTS idx_properties_price_amount
  ON properties (price_amount);

CREATE INDEX IF NOT EXISTS idx_properties_city
  ON properties (city);

CREATE INDEX IF NOT EXISTS idx_properties_property_type
  ON properties (property_type);

CREATE INDEX IF NOT EXISTS idx_properties_bedrooms
  ON properties (bedrooms);

CREATE INDEX IF NOT EXISTS idx_properties_status
  ON properties (status);
