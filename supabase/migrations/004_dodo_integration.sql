-- =====================================================
-- Dodo Payments Integration Migration
-- - Adds dodo_product_id mapping to credit_packages
-- - Extends payment_provider enum with 'dodo'
-- - Adds unique index on purchases.transaction_id for idempotency
-- - Maps known Dodo product IDs to existing packages by credits
-- =====================================================

-- 1) Add Dodo product id column to credit_packages
ALTER TABLE credit_packages
  ADD COLUMN IF NOT EXISTS dodo_product_id TEXT UNIQUE;

-- 2) Extend payment_provider enum with 'dodo' if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'dodo' AND enumtypid = 'payment_provider'::regtype
  ) THEN
    ALTER TYPE payment_provider ADD VALUE 'dodo';
  END IF;
END$$;

-- 3) Ensure purchases.transaction_id is unique (idempotency across providers)
-- Note: multiple NULLs are allowed by UNIQUE index semantics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uq_purchases_transaction_id'
  ) THEN
    CREATE UNIQUE INDEX uq_purchases_transaction_id ON purchases (transaction_id);
  END IF;
END$$;

-- 4) Optional mapping: Assign Dodo product IDs to existing credit packages
-- Adjust these to your created product IDs from Dodo (currently test_mode values):
-- Starter Credits (10)      => pdt_0NWY8bszaO9PGnMf59WYl
-- Popular Credits (50)      => pdt_0NWY8dxjscC751pVJpDjG
-- Pro Credits (150)         => pdt_0NWY8gs1pVvgzpdWxOWz6
-- Enterprise Credits (500)  => pdt_0NWY9DBOIgt6YF4oAhpdK

UPDATE credit_packages
SET dodo_product_id = 'pdt_0NWY8bszaO9PGnMf59WYl'
WHERE credits = 10 AND (dodo_product_id IS NULL OR dodo_product_id != 'pdt_0NWY8bszaO9PGnMf59WYl');

UPDATE credit_packages
SET dodo_product_id = 'pdt_0NWY8dxjscC751pVJpDjG'
WHERE credits = 50 AND (dodo_product_id IS NULL OR dodo_product_id != 'pdt_0NWY8dxjscC751pVJpDjG');

UPDATE credit_packages
SET dodo_product_id = 'pdt_0NWY8gs1pVvgzpdWxOWz6'
WHERE credits = 150 AND (dodo_product_id IS NULL OR dodo_product_id != 'pdt_0NWY8gs1pVvgzpdWxOWz6');

UPDATE credit_packages
SET dodo_product_id = 'pdt_0NWY9DBOIgt6YF4oAhpdK'
WHERE credits = 500 AND (dodo_product_id IS NULL OR dodo_product_id != 'pdt_0NWY9DBOIgt6YF4oAhpdK');