// Supabase Edge Function: save-balance-snapshot
// Purpose: Save weekly snapshots of all payment type balances
// Invoked by: GitHub Actions weekly cron job (every Sunday)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentType {
  id: number;
  name: string;
  current_balance: number | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get all payment types with their current balances
    const { data: paymentTypes, error: fetchError } = await supabase
      .from('payment_types')
      .select('id, name, current_balance')
      .order('id');

    if (fetchError) {
      console.error('Error fetching payment types:', fetchError);
      throw fetchError;
    }

    if (!paymentTypes || paymentTypes.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No payment types found',
          count: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get current date for snapshot
    const snapshotDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Prepare snapshot records
    const snapshots = paymentTypes.map((pt: PaymentType) => ({
      payment_type_id: pt.id,
      balance: pt.current_balance ?? 0,
      snapshot_date: snapshotDate,
    }));

    // Insert snapshots (upsert to handle duplicates)
    const { error: insertError, count } = await supabase
      .from('payment_type_balance_history')
      .upsert(snapshots, {
        onConflict: 'payment_type_id,snapshot_date',
        count: 'exact',
      });

    if (insertError) {
      console.error('Error inserting balance snapshots:', insertError);
      throw insertError;
    }

    const responseData = {
      success: true,
      message: 'Balance snapshots saved successfully',
      snapshot_date: snapshotDate,
      count: count ?? snapshots.length,
      payment_types: paymentTypes.map((pt: PaymentType) => ({
        id: pt.id,
        name: pt.name,
        balance: pt.current_balance ?? 0,
      })),
    };

    console.log('Snapshot saved:', responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in save-balance-snapshot function:', error);

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
