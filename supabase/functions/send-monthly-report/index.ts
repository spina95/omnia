// Supabase Edge Function: send-monthly-report
// Purpose: Generate and send monthly financial report via email
// Invoked by: GitHub Actions monthly cron job (first day of month)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODO: Replace with your actual email address
const RECIPIENT_EMAIL = 'andreaspinazzola3195@gmail.com';

interface Expense {
  id: number;
  name: string;
  amount: number;
  date: string;
  expense_categories: { name: string; color: string };
  payment_types: { name: string };
}

interface Income {
  amount: number;
}

interface CategoryBreakdown {
  name: string;
  color: string;
  total: number;
  percentage: number;
}

interface PaymentTypeBalance {
  name: string;
  current_balance: number;
  color: string;
}

interface Budget {
  id: number;
  max_amount: number;
  payment_type_id: number | null;
  category_id: number | null;
  period: string;
  payment_types?: { name: string };
  expense_categories?: { name: string };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('FROM_EMAIL');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    if (!resendApiKey || !fromEmail) {
      throw new Error('Missing email service environment variables: RESEND_API_KEY or FROM_EMAIL');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Calculate date range for previous month
    const today = new Date();
    const firstDayPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const startDate = firstDayPrevMonth.toISOString().split('T')[0];
    const endDate = lastDayPrevMonth.toISOString().split('T')[0];

    console.log(`Generating report for period: ${startDate} to ${endDate}`);

    // Query expenses for the month
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(
        `
        id, name, amount, date,
        expense_categories ( name, color ),
        payment_types ( name )
      `
      )
      .gte('date', startDate)
      .lte('date', endDate)
      .order('amount', { ascending: false });

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      throw expensesError;
    }

    // Query incomes for the month
    const { data: incomes, error: incomesError } = await supabase
      .from('incomes')
      .select('amount')
      .gte('date', startDate)
      .lte('date', endDate);

    if (incomesError) {
      console.error('Error fetching incomes:', incomesError);
      throw incomesError;
    }

    // Query payment types with current balances
    const { data: paymentTypes, error: paymentTypesError } = await supabase
      .from('payment_types')
      .select('name, current_balance, color')
      .order('name');

    if (paymentTypesError) {
      console.error('Error fetching payment types:', paymentTypesError);
      throw paymentTypesError;
    }

    // Query budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select(
        `
        id, max_amount, payment_type_id, category_id, period,
        payment_types ( name ),
        expense_categories ( name )
      `
      )
      .eq('period', 'monthly');

    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError);
      throw budgetsError;
    }

    // Calculate aggregated statistics
    const totalExpenses = (expenses || []).reduce((sum: number, e: Expense) => sum + e.amount, 0);
    const totalIncomes = (incomes || []).reduce((sum: number, i: Income) => sum + i.amount, 0);
    const balance = totalIncomes - totalExpenses;
    const savingsRate = totalIncomes > 0 ? ((balance / totalIncomes) * 100).toFixed(1) : '0.0';

    // Top 5 expenses
    const topExpenses = (expenses || []).slice(0, 5);

    // Expenses by category
    const categoryMap = new Map<string, { total: number; color: string }>();
    (expenses || []).forEach((e: Expense) => {
      const categoryName = e.expense_categories?.name || 'Uncategorized';
      const categoryColor = e.expense_categories?.color || '#gray';
      const existing = categoryMap.get(categoryName) || { total: 0, color: categoryColor };
      categoryMap.set(categoryName, { total: existing.total + e.amount, color: categoryColor });
    });

    const expensesByCategory: CategoryBreakdown[] = Array.from(categoryMap.entries())
      .map(([name, { total, color }]) => ({
        name,
        color,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Get budget spending using RPC function
    const budgetStatuses = [];
    for (const budget of budgets || []) {
      const { data: spendingData, error: spendingError } = await supabase.rpc(
        'get_budget_spending',
        { budget_id: budget.id }
      );

      if (!spendingError && spendingData !== null) {
        const spending = Number(spendingData);
        const percentage = budget.max_amount > 0 ? (spending / budget.max_amount) * 100 : 0;

        // Generate budget name from payment type and category
        const paymentTypeName = budget.payment_types?.name || 'All Accounts';
        const categoryName = budget.expense_categories?.name || 'All Categories';
        const budgetName = budget.expense_categories
          ? `${categoryName} (${paymentTypeName})`
          : paymentTypeName;

        budgetStatuses.push({
          name: budgetName,
          amount: budget.max_amount,
          spending,
          percentage: percentage.toFixed(1),
          status: percentage > 100 ? 'exceeded' : percentage > 80 ? 'warning' : 'good',
        });
      }
    }

    // Total account balance
    const totalAccountBalance = (paymentTypes || []).reduce(
      (sum: number, pt: PaymentTypeBalance) => sum + (pt.current_balance || 0),
      0
    );

    // Format month name
    const monthName = firstDayPrevMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    // Generate HTML email template
    const htmlContent = generateEmailTemplate({
      monthName,
      totalIncomes,
      totalExpenses,
      balance,
      savingsRate,
      topExpenses,
      expensesByCategory,
      paymentTypes: paymentTypes || [],
      totalAccountBalance,
      budgetStatuses,
    });

    // Send email via Resend API (direct fetch instead of SDK to avoid Deno compatibility issues)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: RECIPIENT_EMAIL,
        subject: `Monthly Financial Report - ${monthName}`,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error('Error sending email:', errorData);
      throw new Error(`Failed to send email: ${emailResponse.status} ${JSON.stringify(errorData)}`);
    }

    const emailData = await emailResponse.json();
    console.log('Email sent successfully:', emailData);

    // Log the report (optional - for tracking)
    const { error: logError } = await supabase.from('email_reports_log').insert({
      report_type: 'monthly',
      sent_at: new Date().toISOString(),
      recipient_email: RECIPIENT_EMAIL,
      status: 'sent',
      period_start: startDate,
      period_end: endDate,
    });

    if (logError) {
      console.warn('Warning: Failed to log report (table may not exist):', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Monthly report sent successfully',
        period: { start: startDate, end: endDate },
        recipient: RECIPIENT_EMAIL,
        email_id: emailData?.id,
        stats: {
          totalIncomes,
          totalExpenses,
          balance,
          savingsRate,
          topExpensesCount: topExpenses.length,
          categoriesCount: expensesByCategory.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-monthly-report function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Generate HTML email template
function generateEmailTemplate(data: {
  monthName: string;
  totalIncomes: number;
  totalExpenses: number;
  balance: number;
  savingsRate: string;
  topExpenses: Expense[];
  expensesByCategory: CategoryBreakdown[];
  paymentTypes: PaymentTypeBalance[];
  totalAccountBalance: number;
  budgetStatuses: Array<{
    name: string;
    amount: number;
    spending: number;
    percentage: string;
    status: string;
  }>;
}): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Financial Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; color: #e2e8f0;">
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 10px 0;">Monthly Financial Report</h1>
      <p style="color: #94a3b8; font-size: 18px; margin: 0;">${data.monthName}</p>
    </div>

    <!-- Summary Cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-bottom: 40px;">
      
      <!-- Total Incomes Card -->
      <div style="background-color: #111111; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; margin: 4px;">
        <div style="color: #10b981; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Total Incomes
        </div>
        <div style="color: #ffffff; font-size: 28px; font-weight: 700;">
          ${formatCurrency(data.totalIncomes)}
        </div>
      </div>

      <!-- Total Expenses Card -->
      <div style="background-color: #111111; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; margin: 4px;">
        <div style="color: #ef4444; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Total Expenses
        </div>
        <div style="color: #ffffff; font-size: 28px; font-weight: 700;">
          ${formatCurrency(data.totalExpenses)}
        </div>
      </div>

      <!-- Balance Card -->
      <div style="background-color: #111111; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; margin: 4px;">
        <div style="color: #10b981; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Balance
        </div>
        <div style="color: ${
          data.balance >= 0 ? '#10b981' : '#ef4444'
        }; font-size: 28px; font-weight: 700;">
          ${formatCurrency(data.balance)}
        </div>
      </div>

      <!-- Savings Rate Card -->
      <div style="background-color: #111111; border: 1px solid #2a2a2a; border-radius: 12px; padding: 24px; margin: 4px;">
        <div style="color: #10b981; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
          Savings Rate
        </div>
        <div style="color: #ffffff; font-size: 28px; font-weight: 700;">
          ${data.savingsRate}%
        </div>
      </div>

    </div>

    <!-- Top 5 Expenses -->
    ${
      data.topExpenses.length > 0
        ? `
    <div style="background-color: #111111; border: 1px solid #2a2a2a; border-radius: 12px; margin-bottom: 30px; overflow: hidden;">
      <div style="padding: 20px; border-bottom: 1px solid #2a2a2a;">
        <h3 style="color: #ffffff; margin: 0; font-size: 18px;">Top 5 Highest Expenses</h3>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #000000;">
            <th style="padding: 12px 20px; text-align: left; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Name</th>
            <th style="padding: 12px 20px; text-align: left; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Category</th>
            <th style="padding: 12px 20px; text-align: left; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Date</th>
            <th style="padding: 12px 20px; text-align: right; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.topExpenses
            .map(
              (expense, index) => `
          <tr style="border-bottom: 1px solid #2a2a2a;">
            <td style="padding: 16px 20px; color: #e2e8f0; font-size: 14px;">${expense.name}</td>
            <td style="padding: 16px 20px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: ${
                expense.expense_categories?.color || '#6b7280'
              }20; color: ${
                expense.expense_categories?.color || '#6b7280'
              }; border-radius: 12px; font-size: 12px; font-weight: 600;">
                ${expense.expense_categories?.name || 'Uncategorized'}
              </span>
            </td>
            <td style="padding: 16px 20px; color: #94a3b8; font-size: 14px;">${formatDate(
              expense.date
            )}</td>
            <td style="padding: 16px 20px; text-align: right; color: #ef4444; font-weight: 600; font-size: 14px;">
              ${formatCurrency(expense.amount)}
            </td>
          </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <!-- Expenses by Category -->
    ${
      data.expensesByCategory.length > 0
        ? `
    <div style="background-color: #111111; border: 1px solid #2a2a2a; border-radius: 12px; margin-bottom: 30px; overflow: hidden;">
      <div style="padding: 20px; border-bottom: 1px solid #2a2a2a;">
        <h3 style="color: #ffffff; margin: 0; font-size: 18px;">Expenses by Category</h3>
      </div>
      <div style="padding: 20px;">
        ${data.expensesByCategory
          .map(
            (category) => `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center;">
              <span style="color: #e2e8f0; font-size: 14px; font-weight: 500;">${
                category.name
              }</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-left: 10px;">
              <span style="color: #ef4444; font-size: 14px; font-weight: 600;">${formatCurrency(
                category.total
              )}</span>
              <span style="color: #94a3b8; font-size: 14px; margin-left: 10px;">${category.percentage.toFixed(
                1
              )}%</span>
            </div>
          </div>
          <div style="width: 100%; height: 8px; background-color: #000000; border-radius: 4px; overflow: hidden;">
            <div style="width: ${Math.min(
              category.percentage,
              100
            )}%; height: 100%; background-color: ${
              category.color
            }; transition: width 0.3s ease;"></div>
          </div>
        </div>
        `
          )
          .join('')}
      </div>
    </div>
    `
        : ''
    }

    <!-- Account Balances -->
    ${
      data.paymentTypes.length > 0
        ? `
    <div style="background-color: #111111; border: 1px solid #2a2a2a; border-radius: 12px; margin-bottom: 30px; overflow: hidden;">
      <div style="padding: 20px; border-bottom: 1px solid #2a2a2a;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">Account Balances</span>
          <div style="display: flex; align-items: center; gap: 8px; margin-left: 10px;">
            <span style="color: #94a3b8; font-size: 18px;">Total:</span>
            <span style="color: #10b981; font-size: 18px; font-weight: 600;">${formatCurrency(
              data.totalAccountBalance
            )}</span>
          </div>
        </div>
      </div>
      <div style="padding: 20px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
          ${data.paymentTypes
            .map(
              (pt) => `
          <div style="background-color: #000000; border: 1px solid #2a2a2a; border-radius: 8px; padding: 16px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="color: #94a3b8; font-size: 13px; font-weight: 500;">${pt.name}</span>
            </div>
            <div style="color: ${
              (pt.current_balance || 0) >= 0 ? '#10b981' : '#ef4444'
            }; font-size: 20px; font-weight: 700;">
              ${formatCurrency(pt.current_balance || 0)}
            </div>
          </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
    `
        : ''
    }

    <!-- Budget Status -->
    ${
      data.budgetStatuses.length > 0
        ? `
    <div style="background-color: #111111; border: 1px solid #2a2a2a; border-radius: 12px; margin-bottom: 30px; overflow: hidden;">
      <div style="padding: 20px; border-bottom: 1px solid #2a2a2a;">
        <h3 style="color: #ffffff; margin: 0; font-size: 18px;">Monthly Budgets</h3>
      </div>
      <div style="padding: 20px;">
        ${data.budgetStatuses
          .map((budget) => {
            const statusColor =
              budget.status === 'exceeded'
                ? '#ef4444'
                : budget.status === 'warning'
                ? '#f59e0b'
                : '#10b981';
            return `
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: #e2e8f0; font-size: 14px; font-weight: 500;">${budget.name}</span>
              <div style="display: flex; align-items: center; gap: 4px; text-align: right;">
                <span style="color: #ef4444; font-size: 14px; font-weight: 600;">${formatCurrency(
                  budget.spending
                )}</span>
                <span style="color: #94a3b8; font-size: 14px;"> / ${formatCurrency(
                  budget.amount
                )}</span>
              </div>
            </div>
            <div style="width: 100%; height: 8px; background-color: #000000; border-radius: 4px; overflow: hidden;">
              <div style="width: ${Math.min(
                parseFloat(budget.percentage),
                100
              )}%; height: 100%; background-color: ${statusColor}; transition: width 0.3s ease;"></div>
            </div>
            <div style="margin-top: 4px; text-align: right;">
              <span style="color: ${statusColor}; font-size: 12px; font-weight: 600;">${
              budget.percentage
            }%</span>
            </div>
          </div>
          `;
          })
          .join('')}
      </div>
    </div>
    `
        : ''
    }

    <!-- Footer -->
    <div style="text-align: center; padding-top: 30px; border-top: 1px solid #2a2a2a;">
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">
        Report generato automaticamente da <strong style="color: #ffffff;">Omnia Finance</strong>
      </p>
      <p style="color: #64748b; font-size: 12px; margin: 10px 0 0 0;">
        ${new Date().toLocaleDateString('it-IT', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
    </div>

  </div>
</body>
</html>
  `;
}
