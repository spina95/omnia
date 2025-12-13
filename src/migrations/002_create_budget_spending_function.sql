-- Drop function if it exists
DROP FUNCTION IF EXISTS get_budget_spending(INTEGER);

-- Create function to calculate budget spending based on period
-- Updated to handle NULL payment_type_id (applies to all payment types)
CREATE OR REPLACE FUNCTION get_budget_spending(input_budget_id INTEGER)
RETURNS TABLE(
  budget_id BIGINT,
  max_amount NUMERIC,
  period VARCHAR(10),
  current_spending NUMERIC,
  percentage_used NUMERIC,
  payment_type_name VARCHAR(255),
  category_name VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  WITH budget_info AS (
    SELECT 
      b.id,
      b.max_amount,
      b.period,
      b.payment_type_id,
      b.category_id,
      -- Handle NULL payment_type_id: show "All Accounts" when NULL
      CASE 
        WHEN b.payment_type_id IS NULL THEN 'All Accounts'
        ELSE pt.name
      END as payment_type_name,
      ec.name as category_name
    FROM budgets b
    LEFT JOIN payment_types pt ON b.payment_type_id = pt.id
    LEFT JOIN expense_categories ec ON b.category_id = ec.id
    WHERE b.id = input_budget_id
  ),
  spending_calc AS (
    SELECT 
      bi.id,
      bi.max_amount,
      bi.period,
      bi.payment_type_name,
      bi.category_name,
      COALESCE(SUM(e.amount), 0) as current_spending
    FROM budget_info bi
    LEFT JOIN expenses e ON (
      -- For NULL payment_type_id: include all payment types
      (bi.payment_type_id IS NULL)
      OR
      -- For specific payment_type_id: match only that payment type
      (e."paymentType_id" = bi.payment_type_id)
    )
    AND (
      (bi.category_id IS NULL) -- NULL category means all categories
      OR (e.category_id = bi.category_id)
    )
    AND (
      -- Weekly period: last 7 days
      (bi.period = 'weekly' AND e.date >= CURRENT_DATE - INTERVAL '6 days')
      OR
      -- Monthly period: current month
      (bi.period = 'monthly' AND DATE_TRUNC('month', e.date) = DATE_TRUNC('month', CURRENT_DATE))
      OR
      -- Yearly period: current year
      (bi.period = 'yearly' AND DATE_TRUNC('year', e.date) = DATE_TRUNC('year', CURRENT_DATE))
    )
    GROUP BY bi.id, bi.max_amount, bi.period, bi.payment_type_name, bi.category_name
  )
  SELECT 
    sc.id,
    sc.max_amount,
    sc.period,
    sc.current_spending,
    CASE 
      WHEN sc.max_amount > 0 THEN ROUND((sc.current_spending / sc.max_amount) * 100, 2)
      ELSE 0
    END as percentage_used,
    sc.payment_type_name,
    sc.category_name
  FROM spending_calc sc;
END;
$$ LANGUAGE plpgsql;
