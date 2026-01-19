-- =====================================================
-- MIGRATION: Update signup bonus to 100 credits
-- Run this if you already have the tables created
-- =====================================================

-- Update the trigger function to give 100 credits instead of 5
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  
  -- Create credits record with signup bonus (100 free credits)
  INSERT INTO credits (user_id, balance, lifetime_credits)
  VALUES (NEW.id, 100, 100);
  
  -- Record the bonus transaction
  INSERT INTO credit_transactions (user_id, amount, type, balance_after, description)
  VALUES (NEW.id, 100, 'bonus', 100, 'Welcome bonus - 100 free credits');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Update existing users who have 5 credits to 100 credits
-- Uncomment the lines below if you want to give existing users more credits

-- UPDATE credits 
-- SET balance = 100, lifetime_credits = 100 
-- WHERE balance = 5 AND lifetime_credits = 5;
