-- Migration 010: Add Payment Type Balance Tracking
-- This migration adds balance tracking capabilities to payment_types table
-- Includes automatic balance updates via triggers on expenses and incomes tables

-- Add new columns to payment_types table
ALTER TABLE payment_types ADD COLUMN current_balance NUMERIC DEFAULT 0;
ALTER TABLE payment_types ADD COLUMN last_balance_update TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Trigger function to update balance when expense is inserted/updated/deleted
CREATE OR REPLACE FUNCTION update_payment_type_balance_on_expense()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Subtract expense amount from balance
    IF NEW."paymentType_id" IS NOT NULL THEN
      UPDATE payment_types
      SET current_balance = current_balance - NEW.amount,
          last_balance_update = NOW()
      WHERE id = NEW."paymentType_id";
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If payment type changed, update both old and new
    IF OLD."paymentType_id" IS DISTINCT FROM NEW."paymentType_id" THEN
      -- Restore amount to old payment type
      IF OLD."paymentType_id" IS NOT NULL THEN
        UPDATE payment_types
        SET current_balance = current_balance + OLD.amount,
            last_balance_update = NOW()
        WHERE id = OLD."paymentType_id";
      END IF;
      -- Subtract amount from new payment type
      IF NEW."paymentType_id" IS NOT NULL THEN
        UPDATE payment_types
        SET current_balance = current_balance - NEW.amount,
            last_balance_update = NOW()
        WHERE id = NEW."paymentType_id";
      END IF;
    ELSE
      -- Same payment type, adjust for amount difference
      IF NEW."paymentType_id" IS NOT NULL AND OLD.amount <> NEW.amount THEN
        UPDATE payment_types
        SET current_balance = current_balance + OLD.amount - NEW.amount,
            last_balance_update = NOW()
        WHERE id = NEW."paymentType_id";
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Restore amount to balance when expense is deleted
    IF OLD."paymentType_id" IS NOT NULL THEN
      UPDATE payment_types
      SET current_balance = current_balance + OLD.amount,
          last_balance_update = NOW()
      WHERE id = OLD."paymentType_id";
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on expenses table
CREATE TRIGGER trigger_update_balance_on_expense
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_type_balance_on_expense();

-- Trigger function to update balance when income is inserted/updated/deleted
CREATE OR REPLACE FUNCTION update_payment_type_balance_on_income()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Add income amount to balance
    IF NEW."paymentType_id" IS NOT NULL THEN
      UPDATE payment_types
      SET current_balance = current_balance + NEW.amount,
          last_balance_update = NOW()
      WHERE id = NEW."paymentType_id";
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If payment type changed, update both old and new
    IF OLD."paymentType_id" IS DISTINCT FROM NEW."paymentType_id" THEN
      -- Subtract amount from old payment type
      IF OLD."paymentType_id" IS NOT NULL THEN
        UPDATE payment_types
        SET current_balance = current_balance - OLD.amount,
            last_balance_update = NOW()
        WHERE id = OLD."paymentType_id";
      END IF;
      -- Add amount to new payment type
      IF NEW."paymentType_id" IS NOT NULL THEN
        UPDATE payment_types
        SET current_balance = current_balance + NEW.amount,
            last_balance_update = NOW()
        WHERE id = NEW."paymentType_id";
      END IF;
    ELSE
      -- Same payment type, adjust for amount difference
      IF NEW."paymentType_id" IS NOT NULL AND OLD.amount <> NEW.amount THEN
        UPDATE payment_types
        SET current_balance = current_balance - OLD.amount + NEW.amount,
            last_balance_update = NOW()
        WHERE id = NEW."paymentType_id";
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Subtract amount from balance when income is deleted
    IF OLD."paymentType_id" IS NOT NULL THEN
      UPDATE payment_types
      SET current_balance = current_balance - OLD.amount,
          last_balance_update = NOW()
      WHERE id = OLD."paymentType_id";
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on incomes table
CREATE TRIGGER trigger_update_balance_on_income
  AFTER INSERT OR UPDATE OR DELETE ON incomes
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_type_balance_on_income();

-- Note: After running this migration, set initial balances manually from the dashboard.
-- The triggers will automatically update balances when expenses/incomes are created, updated, or deleted.
