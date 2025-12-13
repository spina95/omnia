-- Make payment_type_id nullable in budgets table
-- This allows budgets to apply to all payment types when payment_type_id is NULL

-- Remove the NOT NULL constraint from payment_type_id
ALTER TABLE budgets ALTER COLUMN payment_type_id DROP NOT NULL;

-- Update the unique constraint to handle NULL values properly
-- When payment_type_id is NULL, we still want to ensure uniqueness for the combination
-- But we need to handle NULL values specially since NULL != NULL in SQL
ALTER TABLE budgets DROP CONSTRAINT budgets_payment_type_id_category_id_period_key;

-- Create a partial unique index that only applies when payment_type_id is NOT NULL
-- This maintains uniqueness for non-NULL payment types
CREATE UNIQUE INDEX budgets_payment_type_id_category_id_period_unique_idx 
ON budgets (payment_type_id, category_id, period) 
WHERE payment_type_id IS NOT NULL;

-- Create a unique index for NULL payment_type_id to ensure only one "all payment types" budget per category/period
CREATE UNIQUE INDEX budgets_all_payment_types_unique_idx 
ON budgets (category_id, period) 
WHERE payment_type_id IS NULL;
