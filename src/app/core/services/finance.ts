import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

export interface Expense {
  id: number;
  name: string;
  amount: number;
  date: string; // or Date
  category_id: number;
  category: {
    id: number;
    name: string;
  };
  paymentType_id: number;
  paymentType: {
    id: number;
    name: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class FinanceService {
  constructor(private supabase: SupabaseService) {}

  async getExpenses(params: {
    page: number;
    pageSize: number;
    sort?: string;
    order?: 'asc' | 'desc';
    month?: number;
    year?: number;
    categoryId?: number;
    paymentTypeId?: number;
    search?: string;
  }) {
    const { page, pageSize, sort, order, month, year, categoryId, paymentTypeId, search } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client.from('expenses').select(
      `
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `,
      { count: 'exact' }
    );

    // Apply Filters
    if (month) {
      // Supabase/Postgres doesn't have a direct "month" filter on date column easily without RPC or raw SQL in client usually,
      // but we can filter by date range.
      // Construct start and end date for the month.
      // Or if we can use .filter() with a postgres function equivalent?
      // Easier: Calculate Start/End date of month in JS.
      // Note: 'year' is also needed if 'month' is provided, or we assume current year?
      // Usually filtering by Month implies a specific MM-YYYY.
      // If year is not provided, we might default to current year or ignore partial date filter?
      // Let's assume user provides both or we handle logic.

      const filterYear = year || new Date().getFullYear();
      const startDate = new Date(filterYear, month - 1, 1);
      const endDate = new Date(filterYear, month, 0); // Last day of month

      // Adjust for timezone - simplistic approach: YYYY-MM-DD string comparison
      // supabase 'date' column is usually YYYY-MM-DD or timestamptz.
      // Safer to use gte and lte with string ISO formats.

      // Format to YYYY-MM-DD
      const startStr = `${filterYear}-${String(month).padStart(2, '0')}-01`;
      // For end date, we can just do < next month 1st day
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? filterYear + 1 : filterYear;
      const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

      query = query.gte('date', startStr).lt('date', endStr);
    } else if (year) {
      // Only year filter
      const startStr = `${year}-01-01`;
      const endStr = `${year + 1}-01-01`;
      query = query.gte('date', startStr).lt('date', endStr);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (paymentTypeId) {
      query = query.eq('paymentType_id', paymentTypeId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Sorting
    if (sort) {
      if (sort === 'expense_categories.name') {
        // This is tricky with Supabase standard client side ordering without flattening.
        // We might ignore or implement complex logic.
        // For now fallback to date.
        query = query.order('date', { ascending: false });
      } else if (sort === 'payment_types.name') {
        query = query.order('date', { ascending: false });
      } else {
        query = query.order(sort, { ascending: order === 'asc' });
      }
    } else {
      query = query.order('date', { ascending: false }); // Default sort
    }

    // Pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    return { data, count };
  }

  async getCategories() {
    const { data, error } = await this.supabase.client
      .from('expense_categories')
      .select('id, name, color')
      .order('name');

    if (error) throw error;
    return data;
  }

  async getPaymentTypes() {
    const { data, error } = await this.supabase.client
      .from('payment_types')
      .select('id, name, color')
      .order('name');

    if (error) throw error;
    return data;
  }

  async createExpense(expense: {
    name: string;
    amount: number;
    date: string;
    category_id?: number;
    payment_type_id?: number;
  }) {
    // Map payment_type_id to paymentType_id (database column name)
    const dbExpense: any = { ...expense };
    if (expense.payment_type_id !== undefined) {
      dbExpense.paymentType_id = expense.payment_type_id;
      delete dbExpense.payment_type_id;
    }

    const { data, error } = await this.supabase.client
      .from('expenses')
      .insert(dbExpense)
      .select(
        `
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  async updateExpense(
    id: number,
    updates: {
      name?: string;
      amount?: number;
      date?: string;
      category_id?: number;
      payment_type_id?: number;
    }
  ) {
    // Map payment_type_id to paymentType_id (database column name)
    const dbUpdates: any = { ...updates };
    if (updates.payment_type_id !== undefined) {
      dbUpdates.paymentType_id = updates.payment_type_id;
      delete dbUpdates.payment_type_id;
    }

    const { data, error } = await this.supabase.client
      .from('expenses')
      .update(dbUpdates)
      .eq('id', id)
      .select(
        `
        id,
        name,
        amount,
        date,
        category_id,
        expense_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  async deleteExpense(id: number) {
    const { error } = await this.supabase.client.from('expenses').delete().eq('id', id);

    if (error) throw error;
  }

  // ==================== INCOMES ====================

  async getIncomes(params: {
    page: number;
    pageSize: number;
    sort?: string;
    order?: 'asc' | 'desc';
    month?: number;
    year?: number;
    categoryId?: number;
    paymentTypeId?: number;
    search?: string;
  }) {
    const {
      page,
      pageSize,
      sort = 'date',
      order = 'desc',
      month,
      year,
      categoryId,
      paymentTypeId,
      search,
    } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase.client.from('incomes').select(
      `
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `,
      { count: 'exact' }
    );

    // Apply Filters
    if (month) {
      const filterYear = year || new Date().getFullYear();
      const startStr = `${filterYear}-${String(month).padStart(2, '0')}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? filterYear + 1 : filterYear;
      const endStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
      query = query.gte('date', startStr).lt('date', endStr);
    } else if (year) {
      const startStr = `${year}-01-01`;
      const endStr = `${year + 1}-01-01`;
      query = query.gte('date', startStr).lt('date', endStr);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (paymentTypeId) {
      query = query.eq('paymentType_id', paymentTypeId);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Pagination
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count };
  }

  async createIncome(income: {
    name: string;
    amount: number;
    date: string;
    category_id?: number;
    payment_type_id?: number;
  }) {
    const dbIncome: any = { ...income };
    if (income.payment_type_id !== undefined) {
      dbIncome.paymentType_id = income.payment_type_id;
      delete dbIncome.payment_type_id;
    }

    const { data, error } = await this.supabase.client
      .from('incomes')
      .insert(dbIncome)
      .select(
        `
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  async updateIncome(
    id: number,
    updates: {
      name?: string;
      amount?: number;
      date?: string;
      category_id?: number;
      payment_type_id?: number;
    }
  ) {
    const dbUpdates: any = { ...updates };
    if (updates.payment_type_id !== undefined) {
      dbUpdates.paymentType_id = updates.payment_type_id;
      delete dbUpdates.payment_type_id;
    }

    const { data, error } = await this.supabase.client
      .from('incomes')
      .update(dbUpdates)
      .eq('id', id)
      .select(
        `
        id,
        name,
        amount,
        date,
        category_id,
        income_categories ( id, name, color ),
        paymentType_id,
        payment_types ( id, name, color )
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  async deleteIncome(id: number) {
    const { error } = await this.supabase.client.from('incomes').delete().eq('id', id);

    if (error) throw error;
  }

  async getIncomeCategories() {
    const { data, error } = await this.supabase.client
      .from('income_categories')
      .select('id, name, color')
      .order('name');

    if (error) throw error;
    return data;
  }

  // ==================== BUDGETS ====================

  async getBudgets() {
    const { data, error } = await this.supabase.client
      .from('budgets')
      .select(
        `
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `
      )
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to ensure proper object structure
    return data?.map((budget: any) => ({
      ...budget,
      payment_types: Array.isArray(budget.payment_types)
        ? budget.payment_types[0] || null
        : budget.payment_types,
      expense_categories: Array.isArray(budget.expense_categories)
        ? budget.expense_categories[0] || null
        : budget.expense_categories,
    }));
  }

  async createBudget(budget: {
    max_amount: number;
    payment_type_id?: number | null;
    category_id?: number;
    period: 'weekly' | 'monthly' | 'yearly';
  }) {
    const { data, error } = await this.supabase.client
      .from('budgets')
      .insert(budget)
      .select(
        `
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `
      )
      .single();

    if (error) throw error;

    // Transform the data to ensure proper object structure
    const transformedData = data
      ? {
          ...data,
          payment_types: data.payment_types?.[0] || null,
          expense_categories: data.expense_categories?.[0] || null,
        }
      : null;

    return transformedData;
  }

  async updateBudget(
    id: number,
    updates: {
      max_amount?: number;
      payment_type_id?: number | null;
      category_id?: number;
      period?: 'weekly' | 'monthly' | 'yearly';
    }
  ) {
    const { data, error } = await this.supabase.client
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select(
        `
        id,
        max_amount,
        period,
        created_at,
        updated_at,
        payment_type_id,
        payment_types ( id, name, color ),
        category_id,
        expense_categories ( id, name, color )
      `
      )
      .single();

    if (error) throw error;

    // Transform the data to ensure proper object structure
    const transformedData = data
      ? {
          ...data,
          payment_types: data.payment_types?.[0] || null,
          expense_categories: data.expense_categories?.[0] || null,
        }
      : null;

    return transformedData;
  }

  async deleteBudget(id: number) {
    const { error } = await this.supabase.client.from('budgets').delete().eq('id', id);

    if (error) throw error;
  }

  async getBudgetSpending(budgetId: number) {
    const { data, error } = await this.supabase.client.rpc('get_budget_spending', {
      input_budget_id: budgetId,
    });

    if (error) throw error;
    return data;
  }
}
