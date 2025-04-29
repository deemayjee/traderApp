-- Create a generic increment function for counters
CREATE OR REPLACE FUNCTION increment(count integer, row_id uuid, column_name text)
RETURNS integer AS $$
DECLARE
  current_value integer;
BEGIN
  -- Get the current value
  EXECUTE format('SELECT %I FROM community_posts WHERE id = $1', column_name)
  INTO current_value
  USING row_id;
  
  -- If current value is null, set it to 0
  IF current_value IS NULL THEN
    current_value := 0;
  END IF;
  
  -- Return the incremented value
  RETURN current_value + count;
END;
$$ LANGUAGE plpgsql; 