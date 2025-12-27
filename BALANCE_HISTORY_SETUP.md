# Weekly Balance Snapshot System

This document explains the weekly balance snapshot system that tracks payment type balances over time.

## Overview

The system consists of:
1. **Database table** (`payment_type_balance_history`) - stores weekly snapshots
2. **Supabase Edge Function** - saves snapshots on demand
3. **GitHub Actions workflow** - triggers the Edge Function every Sunday at 22:00 UTC (23:00 CET)
4. **Dashboard chart** - displays balance history with filters

## Setup Instructions

### 1. Apply Database Migration

Run the migration to create the balance history table:

```bash
# Connect to your Supabase project and run:
psql $DATABASE_URL -f src/migrations/011_create_balance_history_table.sql
```

Or apply via Supabase Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `src/migrations/011_create_balance_history_table.sql`
3. Run the query

### 2. Deploy Edge Function

Install Supabase CLI if not already installed:

```bash
npm install -g supabase
```

Login to Supabase:

```bash
supabase login
```

Link your project:

```bash
supabase link --project-ref your-project-ref
```

Deploy the Edge Function:

```bash
supabase functions deploy save-balance-snapshot
```

Verify deployment:

```bash
supabase functions list
```

### 3. Configure GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add the following secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Your Supabase anon/public key | Supabase Dashboard → Settings → API |

### 4. Test the System

#### Manual Test via GitHub Actions

1. Go to **Actions** tab in your GitHub repository
2. Select **Weekly Balance Snapshot** workflow
3. Click **Run workflow** → **Run workflow**
4. Check the workflow run logs

#### Manual Test via CLI

Test the Edge Function directly:

```bash
curl -X POST \
  "https://your-project-ref.supabase.co/functions/v1/save-balance-snapshot" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json"
```

#### Verify in Database

Check if snapshots were saved:

```sql
SELECT 
  h.snapshot_date,
  pt.name as payment_type,
  h.balance
FROM payment_type_balance_history h
JOIN payment_types pt ON pt.id = h.payment_type_id
ORDER BY h.snapshot_date DESC, pt.name;
```

## How It Works

### Weekly Schedule

- **When**: Every Sunday at 22:00 UTC (23:00 CET / 00:00 CEST+1)
- **What**: GitHub Actions workflow calls the Edge Function
- **Result**: Current balance of all payment types is saved to `payment_type_balance_history`

### Edge Function Logic

1. Fetch all payment types with their `current_balance`
2. Insert/update snapshot for current date
3. Use `ON CONFLICT` to prevent duplicates (allows re-running safely)
4. Return count of snapshots saved

### Dashboard Chart

- **Location**: Home dashboard, after "Account Balances" section
- **Type**: Multi-line chart with one line per payment type
- **Filters**: Respects date range and payment type filters
- **Data**: Shows weekly snapshots within selected date range

## Maintenance

### Manual Snapshot

To create a manual snapshot (e.g., for testing or catchup):

```sql
INSERT INTO payment_type_balance_history (payment_type_id, balance, snapshot_date)
SELECT id, COALESCE(current_balance, 0), CURRENT_DATE
FROM payment_types
ON CONFLICT (payment_type_id, snapshot_date) 
DO UPDATE SET balance = EXCLUDED.balance;
```

### Change Schedule

Edit `.github/workflows/weekly-balance-snapshot.yml`:

```yaml
schedule:
  - cron: '0 22 * * 0'  # Change this cron expression
```

Cron format: `minute hour day-of-month month day-of-week`

Examples:
- Daily at midnight: `'0 0 * * *'`
- Every Monday at 9am: `'0 9 * * 1'`
- First day of month: `'0 0 1 * *'`

### Troubleshooting

#### Workflow fails with 404

- Verify Edge Function is deployed: `supabase functions list`
- Check `SUPABASE_URL` in GitHub secrets matches your project

#### No data in chart

- Check if snapshots exist: `SELECT COUNT(*) FROM payment_type_balance_history;`
- Verify date range filter includes snapshot dates
- Check browser console for errors

#### Duplicate snapshots

The system uses `UPSERT` with `ON CONFLICT`, so duplicates are automatically handled. If you see duplicates, check the unique index:

```sql
SELECT * FROM pg_indexes 
WHERE tablename = 'payment_type_balance_history';
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                        │
│              (Scheduled: Every Sunday)                   │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP POST
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Edge Function                      │
│           (save-balance-snapshot)                        │
└────────────────────┬────────────────────────────────────┘
                     │ SQL INSERT
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL                            │
│      payment_type_balance_history table                  │
└────────────────────┬────────────────────────────────────┘
                     │ SQL SELECT
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Angular Dashboard                           │
│         (Balance History Chart)                          │
└─────────────────────────────────────────────────────────┘
```

## Data Retention

The system does not automatically delete old snapshots. To implement retention:

```sql
-- Delete snapshots older than 2 years
DELETE FROM payment_type_balance_history
WHERE snapshot_date < CURRENT_DATE - INTERVAL '2 years';
```

You can add this as a scheduled job or run manually as needed.

## Future Enhancements

- **Notifications**: Send email/Slack notification if snapshot fails
- **Anomaly detection**: Alert on significant balance changes
- **Comparison view**: Compare current vs previous week/month
- **Export**: Download balance history as CSV/Excel
- **Custom frequency**: Allow daily/monthly snapshots
