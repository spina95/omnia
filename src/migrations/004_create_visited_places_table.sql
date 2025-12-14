-- Create visited_place table
CREATE TABLE IF NOT EXISTS visited_place (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    city TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    visit_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries by user
CREATE INDEX IF NOT EXISTS idx_visited_place_user_id ON visited_place(user_id);
CREATE INDEX IF NOT EXISTS idx_visited_place_user_country ON visited_place(user_id, country_code);

-- Enable Row Level Security
ALTER TABLE visited_place ENABLE ROW LEVEL SECURITY;

-- Policies for visited_place table
-- Users can only see their own visited places
CREATE POLICY "Users can view their own visited places" ON visited_place
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert visited places for themselves
CREATE POLICY "Users can insert their own visited places" ON visited_place
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own visited places
CREATE POLICY "Users can update their own visited places" ON visited_place
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own visited places
CREATE POLICY "Users can delete their own visited places" ON visited_place
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a view for aggregated stats
CREATE OR REPLACE VIEW visited_country_stats AS
SELECT 
    user_id,
    country_code,
    country_name,
    COUNT(*) as places_count
FROM visited_place
GROUP BY user_id, country_code, country_name;

-- Create a function to get user stats
CREATE OR REPLACE FUNCTION get_user_travel_stats(p_user_id UUID)
RETURNS TABLE (
    total_countries INTEGER,
    total_places INTEGER,
    countries_visited TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT vp.country_code)::INTEGER as total_countries,
        COUNT(vp.id)::INTEGER as total_places,
        ARRAY_AGG(DISTINCT vp.country_name)::TEXT[] as countries_visited
    FROM visited_place vp
    WHERE vp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
