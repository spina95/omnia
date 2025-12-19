-- Migration: Create Sankey Flow Function
-- Description: Aggregates income and expense data for Sankey diagram visualization
-- Flow: Income Categories → Accounts (Payment Types) → Expense Categories

CREATE OR REPLACE FUNCTION get_sankey_flow_data(
  start_date DATE,
  end_date DATE,
  payment_type_ids INTEGER[] DEFAULT NULL,
  income_category_ids INTEGER[] DEFAULT NULL,
  expense_category_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE(
  flow_type VARCHAR,
  source_name VARCHAR,
  source_color VARCHAR,
  target_name VARCHAR,
  target_color VARCHAR,
  total_amount NUMERIC
) AS $$
BEGIN
  -- Part 1: Income Category → Account (Payment Type)
  -- Aggregates incomes grouped by income category and payment type
  RETURN QUERY
  SELECT 
    'income_to_account'::VARCHAR as flow_type,
    COALESCE(ic.name, 'Uncategorized') as source_name,
    COALESCE(ic.color, '#3ECF8E') as source_color,
    COALESCE(pt.name, 'Unknown') as target_name,
    COALESCE(pt.color, '#3B82F6') as target_color,
    SUM(i.amount)::NUMERIC as total_amount
  FROM incomes i
  LEFT JOIN income_categories ic ON i.category_id = ic.id
  LEFT JOIN payment_types pt ON i."paymentType_id" = pt.id
  WHERE i.date >= start_date 
    AND i.date < end_date
    AND (payment_type_ids IS NULL OR i."paymentType_id" = ANY(payment_type_ids))
    AND (income_category_ids IS NULL OR i.category_id = ANY(income_category_ids))
  GROUP BY ic.name, ic.color, pt.name, pt.color
  HAVING SUM(i.amount) > 0;
  
  -- Part 2: Account (Payment Type) → Expense Category
  -- Aggregates expenses grouped by payment type and expense category
  RETURN QUERY
  SELECT 
    'account_to_expense'::VARCHAR as flow_type,
    COALESCE(pt.name, 'Unknown') as source_name,
    COALESCE(pt.color, '#3B82F6') as source_color,
    COALESCE(ec.name, 'Uncategorized') as target_name,
    COALESCE(ec.color, '#EF4444') as target_color,
    SUM(e.amount)::NUMERIC as total_amount
  FROM expenses e
  LEFT JOIN expense_categories ec ON e.category_id = ec.id
  LEFT JOIN payment_types pt ON e."paymentType_id" = pt.id
  WHERE e.date >= start_date 
    AND e.date < end_date
    AND (payment_type_ids IS NULL OR e."paymentType_id" = ANY(payment_type_ids))
    AND (expense_category_ids IS NULL OR e.category_id = ANY(expense_category_ids))
  GROUP BY pt.name, pt.color, ec.name, ec.color
  HAVING SUM(e.amount) > 0;
END;
$$ LANGUAGE plpgsql;
