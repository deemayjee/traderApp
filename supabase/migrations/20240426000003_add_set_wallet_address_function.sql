-- Create function to set wallet address
CREATE OR REPLACE FUNCTION set_wallet_address(address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_wallet_address', address, false);
END;
$$; 