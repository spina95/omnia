import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

export interface DashboardStats {
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
  savingsPercentage: number;
  period: string;
}

export interface MonthlyData {
  month: string;
  incomes: number;
  expenses: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface AccountData {
  name: string;
  value: number;
  color: string;
}

export interface MonthCategoryData {
  month: string;
  categories: { [key: string]: number };
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  paymentTypeIds?: number[];
  expenseCategoryIds?: number[];
  incomeCategoryIds?: number[];
}

export interface SankeyFlowData {
  flow_type: string;
  source_name: string;
  source_color: string;
  target_name: string;
  target_color: string;
  total_amount: number;
}

export interface SankeyData {
  node: {
    label: string[];
    color: string[];
    pad: number;
    thickness: number;
  };
  link: {
    source: number[];
    target: number[];
    value: number[];
    color: string[];
  };
  type: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private supabase: SupabaseService) {}

  /**
   * Get summary statistics for the filtered period
   */
  async getDashboardStats(filters?: DashboardFilters): Promise<DashboardStats> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startDate = filters?.startDate || `${currentYear}-01-01`;
    const endDate = filters?.endDate || now.toISOString().slice(0, 10);

    try {
      // Get total incomes
      let incomesQuery = this.supabase.client
        .from('incomes')
        .select('amount')
        .gte('date', startDate)
        .lte('date', endDate);

      if (filters?.paymentTypeIds?.length) {
        incomesQuery = incomesQuery.in('paymentType_id', filters.paymentTypeIds);
      }

      if (filters?.incomeCategoryIds?.length) {
        incomesQuery = incomesQuery.in('category_id', filters.incomeCategoryIds);
      }

      const { data: incomes } = await incomesQuery;

      // Get total expenses
      let expensesQuery = this.supabase.client
        .from('expenses')
        .select('amount')
        .gte('date', startDate)
        .lte('date', endDate);

      if (filters?.paymentTypeIds?.length) {
        expensesQuery = expensesQuery.in('paymentType_id', filters.paymentTypeIds);
      }

      if (filters?.expenseCategoryIds?.length) {
        expensesQuery = expensesQuery.in('category_id', filters.expenseCategoryIds);
      }

      const { data: expenses } = await expensesQuery;

      const totalIncomes = incomes?.reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      // Format period string
      let period = '';
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const startMonth = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const endMonth = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        period = `${startMonth} - ${endMonth}`;
      } else {
        period = `Year ${currentYear}`;
      }

      // Calculate savings percentage
      const savingsPercentage =
        totalIncomes > 0 ? ((totalIncomes - totalExpenses) / totalIncomes) * 100 : 0;

      return {
        totalIncomes,
        totalExpenses,
        balance: totalIncomes - totalExpenses,
        savingsPercentage,
        period,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalIncomes: 0,
        totalExpenses: 0,
        balance: 0,
        savingsPercentage: 0,
        period: '',
      };
    }
  }

  /**
   * Get monthly incomes vs expenses for the filtered period
   */
  async getIncomesVsExpenses(filters?: DashboardFilters): Promise<MonthlyData[]> {
    const now = new Date();
    const startDate = filters?.startDate;
    const endDate = filters?.endDate || now.toISOString().slice(0, 10);

    if (!startDate || !endDate) {
      return [];
    }

    try {
      let incomesQuery = this.supabase.client
        .from('incomes')
        .select('date, amount')
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: true });

      if (filters?.paymentTypeIds?.length) {
        incomesQuery = incomesQuery.in('paymentType_id', filters.paymentTypeIds);
      }
      if (filters?.incomeCategoryIds?.length) {
        incomesQuery = incomesQuery.in('category_id', filters.incomeCategoryIds);
      }

      let expensesQuery = this.supabase.client
        .from('expenses')
        .select('date, amount')
        .gte('date', startDate)
        .lt('date', endDate)
        .order('date', { ascending: true });

      if (filters?.paymentTypeIds?.length) {
        expensesQuery = expensesQuery.in('paymentType_id', filters.paymentTypeIds);
      }
      if (filters?.expenseCategoryIds?.length) {
        expensesQuery = expensesQuery.in('category_id', filters.expenseCategoryIds);
      }

      const [incomesRes, expensesRes] = await Promise.all([incomesQuery, expensesQuery]);

      // Create a map of all months in the date range
      const monthlyData: { [key: string]: MonthlyData } = {};
      const start = new Date(startDate);
      const end = new Date(endDate);
      const current = new Date(start.getFullYear(), start.getMonth(), 1);

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      // Initialize all months in range
      while (current <= end) {
        const monthKey = `${monthNames[current.getMonth()]} ${String(current.getFullYear()).slice(
          2
        )}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            incomes: 0,
            expenses: 0,
          };
        }
        current.setMonth(current.getMonth() + 1);
      }

      // Aggregate incomes by month
      incomesRes.data?.forEach((income) => {
        const date = new Date(income.date);
        const monthKey = `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].incomes += income.amount || 0;
        }
      });

      // Aggregate expenses by month
      expensesRes.data?.forEach((expense) => {
        const date = new Date(expense.date);
        const monthKey = `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].expenses += expense.amount || 0;
        }
      });

      // Return in chronological order
      return Object.keys(monthlyData)
        .sort((a, b) => {
          const dateA = this.parseMonthKey(a);
          const dateB = this.parseMonthKey(b);
          return dateA.getTime() - dateB.getTime();
        })
        .map((key) => monthlyData[key]);
    } catch (error) {
      console.error('Error fetching incomes vs expenses:', error);
      return [];
    }
  }

  private parseMonthKey(key: string): Date {
    const [month, year] = key.split(' ');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthIndex = monthNames.indexOf(month);
    const fullYear = 2000 + parseInt(year, 10);
    return new Date(fullYear, monthIndex, 1);
  }

  /**
   * Get expenses breakdown by category for the filtered period
   */
  async getExpensesByCategory(filters?: DashboardFilters): Promise<CategoryData[]> {
    const now = new Date();
    const startDate = filters?.startDate;
    const endDate = filters?.endDate || now.toISOString().slice(0, 10);

    if (!startDate || !endDate) {
      return [];
    }

    try {
      let query = this.supabase.client
        .from('expenses')
        .select('amount, category_id, expense_categories(name, color)')
        .gte('date', startDate)
        .lt('date', endDate);

      if (filters?.paymentTypeIds?.length) {
        query = query.in('paymentType_id', filters.paymentTypeIds);
      }
      if (filters?.expenseCategoryIds?.length) {
        query = query.in('category_id', filters.expenseCategoryIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate by category
      const categoryMap: { [key: string]: { value: number; color: string } } = {};

      data?.forEach((expense) => {
        const category = expense.expense_categories as any;
        if (category) {
          const name = category.name;
          if (!categoryMap[name]) {
            categoryMap[name] = { value: 0, color: category.color || '#71717a' };
          }
          categoryMap[name].value += expense.amount || 0;
        }
      });

      return Object.entries(categoryMap).map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color,
      }));
    } catch (error) {
      console.error('Error fetching expenses by category:', error);
      return [];
    }
  }

  /**
   * Get expenses by account/payment type for the filtered period
   */
  async getExpensesByAccount(filters?: DashboardFilters): Promise<AccountData[]> {
    const now = new Date();
    const startDate = filters?.startDate;
    const endDate = filters?.endDate || now.toISOString().slice(0, 10);

    if (!startDate || !endDate) {
      return [];
    }

    try {
      let query = this.supabase.client
        .from('expenses')
        .select('amount, paymentType_id, payment_types(name, color)')
        .gte('date', startDate)
        .lt('date', endDate);

      if (filters?.paymentTypeIds?.length) {
        query = query.in('paymentType_id', filters.paymentTypeIds);
      }
      if (filters?.expenseCategoryIds?.length) {
        query = query.in('category_id', filters.expenseCategoryIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      const accountMap: { [key: string]: { value: number; color: string } } = {};

      data?.forEach((expense) => {
        const account = expense.payment_types as any;
        if (account) {
          const name = account.name;
          if (!accountMap[name]) {
            accountMap[name] = { value: 0, color: account.color || '#71717a' };
          }
          accountMap[name].value += expense.amount || 0;
        }
      });

      return Object.entries(accountMap).map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color,
      }));
    } catch (error) {
      console.error('Error fetching expenses by account:', error);
      return [];
    }
  }

  /**
   * Get incomes by account/payment type for the filtered period
   */
  async getIncomesByAccount(filters?: DashboardFilters): Promise<AccountData[]> {
    const now = new Date();
    const startDate = filters?.startDate;
    const endDate = filters?.endDate || now.toISOString().slice(0, 10);

    if (!startDate || !endDate) {
      return [];
    }

    try {
      let query = this.supabase.client
        .from('incomes')
        .select('amount, paymentType_id, payment_types(name, color)')
        .gte('date', startDate)
        .lt('date', endDate);

      if (filters?.paymentTypeIds?.length) {
        query = query.in('paymentType_id', filters.paymentTypeIds);
      }
      if (filters?.incomeCategoryIds?.length) {
        query = query.in('category_id', filters.incomeCategoryIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      const accountMap: { [key: string]: { value: number; color: string } } = {};

      data?.forEach((income) => {
        const account = income.payment_types as any;
        if (account) {
          const name = account.name;
          if (!accountMap[name]) {
            accountMap[name] = { value: 0, color: account.color || '#71717a' };
          }
          accountMap[name].value += income.amount || 0;
        }
      });

      return Object.entries(accountMap).map(([name, data]) => ({
        name,
        value: data.value,
        color: data.color,
      }));
    } catch (error) {
      console.error('Error fetching incomes by account:', error);
      return [];
    }
  }

  /**
   * Get expenses by category per month (stacked bar chart data) for the filtered period
   */
  async getExpensesByCategoryPerMonth(
    filters?: DashboardFilters
  ): Promise<{ categories: string[]; series: any[]; months: string[] }> {
    const now = new Date();
    const startDate = filters?.startDate;
    const endDate = filters?.endDate || now.toISOString().slice(0, 10);

    if (!startDate || !endDate) {
      return { categories: [], series: [], months: [] };
    }

    try {
      let query = this.supabase.client
        .from('expenses')
        .select('amount, date, category_id, expense_categories(name, color)')
        .gte('date', startDate)
        .lt('date', endDate);

      if (filters?.paymentTypeIds?.length) {
        query = query.in('paymentType_id', filters.paymentTypeIds);
      }
      if (filters?.expenseCategoryIds?.length) {
        query = query.in('category_id', filters.expenseCategoryIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];

      // Create a map of all months in the date range
      const monthMap: { [key: string]: number } = {};
      const start = new Date(startDate);
      const end = new Date(endDate);
      const current = new Date(start.getFullYear(), start.getMonth(), 1);
      let monthIndex = 0;

      while (current <= end) {
        const monthKey = `${monthNames[current.getMonth()]} ${String(current.getFullYear()).slice(
          2
        )}`;
        monthMap[monthKey] = monthIndex++;
        current.setMonth(current.getMonth() + 1);
      }

      const monthLabels = Object.keys(monthMap).sort((a, b) => {
        const dateA = this.parseMonthKey(a);
        const dateB = this.parseMonthKey(b);
        return dateA.getTime() - dateB.getTime();
      });

      // Build a map: category -> [monthly values]
      const categoryData: { [key: string]: { values: number[]; color: string } } = {};

      data?.forEach((expense) => {
        const category = expense.expense_categories as any;
        if (category) {
          const categoryName = category.name;
          const expenseDate = new Date(expense.date);
          const monthKey = `${monthNames[expenseDate.getMonth()]} ${String(
            expenseDate.getFullYear()
          ).slice(2)}`;
          const index = monthMap[monthKey];

          if (index !== undefined) {
            if (!categoryData[categoryName]) {
              categoryData[categoryName] = {
                values: new Array(monthLabels.length).fill(0),
                color: category.color || '#71717a',
              };
            }
            categoryData[categoryName].values[index] += expense.amount || 0;
          }
        }
      });

      // Convert to ApexCharts series format
      const categories = Object.keys(categoryData);
      const series = categories.map((cat) => ({
        name: cat,
        data: categoryData[cat].values,
        color: categoryData[cat].color,
      }));

      return { categories, series, months: monthLabels };
    } catch (error) {
      console.error('Error fetching expenses by category per month:', error);
      return { categories: [], series: [], months: [] };
    }
  }

  /**
   * Get the first transaction date from expenses or incomes
   */
  async getFirstTransactionDate(): Promise<string | null> {
    try {
      const [expensesRes, incomesRes] = await Promise.all([
        this.supabase.client
          .from('expenses')
          .select('date')
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle(),
        this.supabase.client
          .from('incomes')
          .select('date')
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

      const expenseDate = expensesRes.data?.date;
      const incomeDate = incomesRes.data?.date;

      if (!expenseDate && !incomeDate) return null;

      if (!expenseDate) return incomeDate;
      if (!incomeDate) return expenseDate;

      return expenseDate < incomeDate ? expenseDate : incomeDate;
    } catch (error) {
      console.error('Error getting first transaction date:', error);
      return null;
    }
  }

  /**
   * Get top 5 highest expenses for the filtered period
   */
  async getTopExpenses(filters?: DashboardFilters): Promise<any[]> {
    try {
      const now = new Date();
      const startDate = filters?.startDate;
      const endDate = filters?.endDate || now.toISOString().slice(0, 10);

      if (!startDate || !endDate) {
        return [];
      }

      let expensesQuery = this.supabase.client
        .from('expenses')
        .select('id, name, amount, date, category_id, expense_categories(name, color)')
        .gte('date', startDate)
        .lt('date', endDate)
        .order('amount', { ascending: false })
        .limit(5);

      if (filters?.paymentTypeIds?.length) {
        expensesQuery = expensesQuery.in('paymentType_id', filters.paymentTypeIds);
      }

      if (filters?.expenseCategoryIds?.length) {
        expensesQuery = expensesQuery.in('category_id', filters.expenseCategoryIds);
      }

      const { data: expenses } = await expensesQuery;

      return (expenses || []).map((e) => ({
        ...e,
        type: 'expense' as const,
        category: (e.expense_categories as any)?.name,
        color: (e.expense_categories as any)?.color,
      }));
    } catch (error) {
      console.error('Error fetching top expenses:', error);
      return [];
    }
  }

  /**
   * Get recent transactions (5 most recent from both incomes and expenses)
   */
  async getRecentTransactions(filters?: DashboardFilters): Promise<any[]> {
    try {
      let incomesQuery = this.supabase.client
        .from('incomes')
        .select('id, name, amount, date, category_id, income_categories(name)')
        .order('date', { ascending: false })
        .limit(3);

      let expensesQuery = this.supabase.client
        .from('expenses')
        .select('id, name, amount, date, category_id, expense_categories(name)')
        .order('date', { ascending: false })
        .limit(3);

      if (filters?.startDate) {
        incomesQuery = incomesQuery.gte('date', filters.startDate);
        expensesQuery = expensesQuery.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        incomesQuery = incomesQuery.lt('date', filters.endDate);
        expensesQuery = expensesQuery.lt('date', filters.endDate);
      }

      if (filters?.paymentTypeIds?.length) {
        incomesQuery = incomesQuery.in('paymentType_id', filters.paymentTypeIds);
        expensesQuery = expensesQuery.in('paymentType_id', filters.paymentTypeIds);
      }

      if (filters?.incomeCategoryIds?.length) {
        incomesQuery = incomesQuery.in('category_id', filters.incomeCategoryIds);
      }
      if (filters?.expenseCategoryIds?.length) {
        expensesQuery = expensesQuery.in('category_id', filters.expenseCategoryIds);
      }

      const [incomesRes, expensesRes] = await Promise.all([incomesQuery, expensesQuery]);

      const incomes = (incomesRes.data || []).map((i) => ({
        ...i,
        type: 'income' as const,
        category: (i.income_categories as any)?.name,
      }));

      const expenses = (expensesRes.data || []).map((e) => ({
        ...e,
        type: 'expense' as const,
        category: (e.expense_categories as any)?.name,
      }));

      // Combine and sort by date
      const combined = [...incomes, ...expenses];
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return combined.slice(0, 5);
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  /**
   * Get Sankey flow data for income categories → accounts → expense categories
   * Uses server-side aggregation via RPC function for performance
   */
  async getSankeyFlowData(filters?: DashboardFilters): Promise<SankeyData> {
    try {
      const { data, error } = await this.supabase.client.rpc('get_sankey_flow_data', {
        start_date: filters?.startDate || '1900-01-01',
        end_date: filters?.endDate || '2100-12-31',
        payment_type_ids: filters?.paymentTypeIds?.length ? filters.paymentTypeIds : null,
        income_category_ids: filters?.incomeCategoryIds?.length ? filters.incomeCategoryIds : null,
        expense_category_ids: filters?.expenseCategoryIds?.length ? filters.expenseCategoryIds : null,
      });

      if (error) {
        console.error('Error fetching Sankey flow data:', error);
        return this.getEmptySankeyData();
      }

      const flowData = data as SankeyFlowData[];
      
      if (!flowData || flowData.length === 0) {
        return this.getEmptySankeyData();
      }

      // Separate the two flow types
      const incomeToAccount = flowData.filter(d => d.flow_type === 'income_to_account');
      const accountToExpense = flowData.filter(d => d.flow_type === 'account_to_expense');

      // Build unique node sets for each level
      const incomeCategoriesMap = new Map<string, string>();
      const accountsMap = new Map<string, string>();
      const expenseCategoriesMap = new Map<string, string>();

      incomeToAccount.forEach(flow => {
        incomeCategoriesMap.set(flow.source_name, flow.source_color);
        accountsMap.set(flow.target_name, flow.target_color);
      });

      accountToExpense.forEach(flow => {
        accountsMap.set(flow.source_name, flow.source_color);
        expenseCategoriesMap.set(flow.target_name, flow.target_color);
      });

      // Create ordered node arrays: Income Categories | Accounts | Expense Categories
      const incomeCategories = Array.from(incomeCategoriesMap.keys());
      const accounts = Array.from(accountsMap.keys());
      const expenseCategories = Array.from(expenseCategoriesMap.keys());

      const nodeLabels = [
        ...incomeCategories,
        ...accounts,
        ...expenseCategories,
      ];

      const nodeColors = [
        ...incomeCategories.map(name => incomeCategoriesMap.get(name) || '#3ECF8E'),
        ...accounts.map(name => accountsMap.get(name) || '#3B82F6'),
        ...expenseCategories.map(name => expenseCategoriesMap.get(name) || '#EF4444'),
      ];

      // Create index map for quick lookup
      const nodeIndexMap = new Map<string, number>();
      incomeCategories.forEach((name, i) => 
        nodeIndexMap.set(`income::${name}`, i)
      );
      accounts.forEach((name, i) => 
        nodeIndexMap.set(`account::${name}`, incomeCategories.length + i)
      );
      expenseCategories.forEach((name, i) => 
        nodeIndexMap.set(`expense::${name}`, incomeCategories.length + accounts.length + i)
      );

      // Build links
      const sources: number[] = [];
      const targets: number[] = [];
      const values: number[] = [];
      const linkColors: string[] = [];

      // Income → Account links
      incomeToAccount.forEach(flow => {
        const sourceIdx = nodeIndexMap.get(`income::${flow.source_name}`);
        const targetIdx = nodeIndexMap.get(`account::${flow.target_name}`);
        
        if (sourceIdx !== undefined && targetIdx !== undefined) {
          sources.push(sourceIdx);
          targets.push(targetIdx);
          values.push(flow.total_amount);
          // Use income category color with transparency
          const color = flow.source_color || '#3ECF8E';
          linkColors.push(this.hexToRgba(color, 0.4));
        }
      });

      // Account → Expense links
      accountToExpense.forEach(flow => {
        const sourceIdx = nodeIndexMap.get(`account::${flow.source_name}`);
        const targetIdx = nodeIndexMap.get(`expense::${flow.target_name}`);
        
        if (sourceIdx !== undefined && targetIdx !== undefined) {
          sources.push(sourceIdx);
          targets.push(targetIdx);
          values.push(flow.total_amount);
          // Use expense category color with transparency
          const color = flow.target_color || '#EF4444';
          linkColors.push(this.hexToRgba(color, 0.4));
        }
      });

      return {
        node: {
          label: nodeLabels,
          color: nodeColors,
          pad: 15,
          thickness: 20,
        },
        link: {
          source: sources,
          target: targets,
          value: values,
          color: linkColors,
        },
        type: 'sankey',
      };
    } catch (error) {
      console.error('Error processing Sankey data:', error);
      return this.getEmptySankeyData();
    }
  }

  /**
   * Returns empty Sankey data structure
   */
  private getEmptySankeyData(): SankeyData {
    return {
      node: {
        label: [],
        color: [],
        pad: 15,
        thickness: 20,
      },
      link: {
        source: [],
        target: [],
        value: [],
        color: [],
      },
      type: 'sankey',
    };
  }

  /**
   * Convert hex color to rgba with opacity
   */
  private hexToRgba(hex: string, opacity: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return `rgba(128, 128, 128, ${opacity})`;
    }
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
}
