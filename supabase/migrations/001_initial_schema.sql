-- =====================================================
-- INFOGRAPHIC AI DATABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX idx_profiles_email ON profiles(email);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. CREDITS TABLE (user balance)
-- =====================================================
CREATE TABLE credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 NOT NULL,
  lifetime_credits INTEGER DEFAULT 0 NOT NULL, -- Total credits ever received
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT positive_balance CHECK (balance >= 0),
  CONSTRAINT unique_user_credits UNIQUE (user_id)
);

-- Create index for user lookups
CREATE INDEX idx_credits_user_id ON credits(user_id);

-- Enable RLS
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;

-- Credits policies
CREATE POLICY "Users can view their own credits" 
  ON credits FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage credits" 
  ON credits FOR ALL 
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. GENERATIONS TABLE (infographic generation history)
-- =====================================================
CREATE TYPE generation_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT, -- Supabase Storage URL
  image_data TEXT, -- Base64 data (optional, for temporary storage)
  aspect_ratio TEXT DEFAULT '9:16',
  image_size TEXT DEFAULT '2K',
  status generation_status DEFAULT 'pending' NOT NULL,
  credits_used INTEGER DEFAULT 1 NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}', -- Store additional info like AI response text
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_status ON generations(status);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);

-- Enable RLS
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

-- Generations policies
CREATE POLICY "Users can view their own generations" 
  ON generations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations" 
  ON generations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations" 
  ON generations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" 
  ON generations FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. PURCHASES TABLE (purchase history)
-- =====================================================
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_provider AS ENUM ('stripe', 'paypal', 'razorpay', 'manual');

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credits_purchased INTEGER NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL, -- Amount in user's currency
  currency TEXT DEFAULT 'USD' NOT NULL,
  payment_provider payment_provider NOT NULL,
  payment_status payment_status DEFAULT 'pending' NOT NULL,
  transaction_id TEXT, -- External payment provider transaction ID
  receipt_url TEXT,
  metadata JSONB DEFAULT '{}', -- Store additional payment info
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(payment_status);
CREATE INDEX idx_purchases_created_at ON purchases(created_at DESC);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Purchases policies
CREATE POLICY "Users can view their own purchases" 
  ON purchases FOR SELECT 
  USING (auth.uid() = user_id);

-- Only system/service role can insert/update purchases
CREATE POLICY "Users can insert purchases" 
  ON purchases FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. CREDIT TRANSACTIONS TABLE (audit log)
-- =====================================================
CREATE TYPE transaction_type AS ENUM (
  'purchase',      -- Credits added via purchase
  'usage',         -- Credits used for generation
  'bonus',         -- Free credits (signup, promo, etc.)
  'refund',        -- Credits refunded
  'adjustment'     -- Manual adjustment
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for additions, negative for usage
  type transaction_type NOT NULL,
  balance_after INTEGER NOT NULL, -- Balance after this transaction
  reference_id UUID, -- Links to generation_id or purchase_id
  reference_type TEXT, -- 'generation' or 'purchase'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Credit transactions policies
CREATE POLICY "Users can view their own transactions" 
  ON credit_transactions FOR SELECT 
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. CREDIT PACKAGES TABLE (available packages)
-- =====================================================
CREATE TABLE credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS (public read for packages)
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages" 
  ON credit_packages FOR SELECT 
  USING (is_active = TRUE);

-- Insert default credit packages
INSERT INTO credit_packages (name, description, credits, price, is_popular, sort_order) VALUES
  ('Starter', 'Perfect for trying out', 10, 4.99, FALSE, 1),
  ('Popular', 'Most popular choice', 50, 19.99, TRUE, 2),
  ('Pro', 'For power users', 150, 49.99, FALSE, 3),
  ('Enterprise', 'Best value for teams', 500, 149.99, FALSE, 4);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to create profile on user signup
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
  VALUES (NEW.id, 100, 100); -- 100 free credits on signup
  
  -- Record the bonus transaction
  INSERT INTO credit_transactions (user_id, amount, type, balance_after, description)
  VALUES (NEW.id, 100, 'bonus', 100, 'Welcome bonus - 100 free credits');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to deduct credits for generation
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_generation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance with lock
  SELECT balance INTO v_current_balance
  FROM credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  -- Update balance
  UPDATE credits
  SET balance = v_new_balance
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, amount, type, balance_after, reference_id, reference_type, description
  ) VALUES (
    p_user_id, -p_amount, 'usage', v_new_balance, p_generation_id, 'generation', 'Infographic generation'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits from purchase
CREATE OR REPLACE FUNCTION add_credits_from_purchase(
  p_user_id UUID,
  p_amount INTEGER,
  p_purchase_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update balance
  UPDATE credits
  SET 
    balance = balance + p_amount,
    lifetime_credits = lifetime_credits + p_amount
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, amount, type, balance_after, reference_id, reference_type, description
  ) VALUES (
    p_user_id, p_amount, 'purchase', v_new_balance, p_purchase_id, 'purchase', 'Credits purchased'
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
