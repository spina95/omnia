export interface Budget {
  id: number;
  max_amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
  payment_type_id?: number | null;
  payment_types: {
    id: number;
    name: string;
    color: string;
  } | null;
  category_id?: number;
  expense_categories?: {
    id: number;
    name: string;
    color: string;
  } | null;
  current_spending?: number;
  percentage_used?: number;
}

export interface BudgetSpending {
  budget_id: number;
  max_amount: number;
  period: string;
  current_spending: number;
  percentage_used: number;
  payment_type_name: string;
  category_name?: string;
}
