import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// Exchange to Country mapping
const EXCHANGE_COUNTRY_MAP: Record<string, string> = {
  NYSE: 'USA',
  NASDAQ: 'USA',
  NasdaqGS: 'USA',
  NasdaqGM: 'USA',
  NasdaqCM: 'USA',
  NYQ: 'USA',
  PCX: 'USA',
  XETRA: 'Germany',
  FRA: 'Germany',
  LSE: 'United Kingdom',
  LON: 'United Kingdom',
  TSE: 'Japan',
  JPX: 'Japan',
  'Euronext Paris': 'France',
  PAR: 'France',
  SIX: 'Switzerland',
  VTX: 'Switzerland',
  BME: 'Spain',
  BIT: 'Italy',
  MIL: 'Italy',
  AMS: 'Netherlands',
  TSX: 'Canada',
  TOR: 'Canada',
  ASX: 'Australia',
  HKSE: 'Hong Kong',
  HKG: 'Hong Kong',
  SSE: 'China',
  SHH: 'China',
  SZSE: 'China',
  SHZ: 'China',
  BSE: 'India',
  NSE: 'India',
  BOM: 'India',
};

export type TransactionType = 'BUY' | 'SELL';

export interface InvestmentTransaction {
  id: number;
  user_id: string;
  ticker: string;
  quantity: number;
  purchase_price: number;
  transaction_date: string;
  transaction_type: TransactionType;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentCurrentPrice {
  ticker: string;
  price: number;
  currency: string;
  exchange_name?: string;
  last_updated: string;
}

export interface PortfolioHolding {
  ticker: string;
  totalQuantity: number;
  averageCost: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  exchange?: string;
  country?: string;
}

export interface PortfolioSummary {
  holdings: PortfolioHolding[];
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export interface GeographicalAllocation {
  country: string;
  value: number;
  percentage: number;
}

export interface FinnhubQuoteResponse {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
}

export interface FinnhubProfileResponse {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

@Injectable({
  providedIn: 'root',
})
export class InvestmentsService {
  constructor(private supabase: SupabaseService, private http: HttpClient) {}

  // ========== Transaction CRUD Operations ==========

  async getTransactions(params?: {
    page?: number;
    pageSize?: number;
    ticker?: string;
    transactionType?: TransactionType;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: InvestmentTransaction[]; count: number }> {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 100;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Check authentication
    const { data: sessionData } = await this.supabase.client.auth.getSession();
    console.log('🔐 Current session:', sessionData?.session ? 'Authenticated' : 'Not authenticated');
    console.log('👤 User ID:', sessionData?.session?.user?.id);

    let query = this.supabase.client
      .from('investment_transactions')
      .select('*', { count: 'exact' })
      .order('transaction_date', { ascending: false });

    if (params?.ticker) {
      query = query.ilike('ticker', params.ticker);
    }

    if (params?.transactionType) {
      query = query.eq('transaction_type', params.transactionType);
    }

    if (params?.startDate) {
      query = query.gte('transaction_date', params.startDate);
    }

    if (params?.endDate) {
      query = query.lte('transaction_date', params.endDate);
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    console.log('📊 Investment transactions query result:', { 
      dataCount: data?.length, 
      totalCount: count, 
      error: error 
    });

    if (error) {
      console.error('❌ Error fetching transactions:', error);
      throw new Error(error.message);
    }

    return { data: data || [], count: count || 0 };
  }

  async getTransactionById(id: number): Promise<InvestmentTransaction | null> {
    const { data, error } = await this.supabase.client
      .from('investment_transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching transaction:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async createTransaction(
    transaction: Omit<InvestmentTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<InvestmentTransaction> {
    const { data, error } = await this.supabase.client
      .from('investment_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async updateTransaction(
    id: number,
    updates: Partial<Omit<InvestmentTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<InvestmentTransaction> {
    const { data, error } = await this.supabase.client
      .from('investment_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      throw new Error(error.message);
    }

    return data;
  }

  async deleteTransaction(id: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('investment_transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      throw new Error(error.message);
    }
  }

  // ========== Price Management ==========

  async getCurrentPrice(ticker: string): Promise<InvestmentCurrentPrice | null> {
    const { data, error } = await this.supabase.client
      .from('investment_current_prices')
      .select('*')
      .eq('ticker', ticker)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching current price:', error);
      return null;
    }

    return data;
  }

  async validateTicker(
    ticker: string
  ): Promise<{ valid: boolean; exchangeName?: string; error?: string }> {
    try {
      // Check if ticker contains exchange suffix (e.g., VWCE.MI, BMW.DE)
      const hasExchange = ticker.includes('.');

      if (hasExchange) {
        // For international tickers, skip validation (Finnhub free tier doesn't support all exchanges)
        return {
          valid: true,
          exchangeName: ticker.split('.')[1],
          error: undefined,
        };
      }

      // For US tickers, validate with Finnhub
      const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${environment.finnhub.apiKey}`;

      const response = await firstValueFrom(this.http.get<FinnhubProfileResponse>(url));

      // Finnhub returns empty object if ticker not found
      if (!response || !response.ticker) {
        return {
          valid: false,
          error:
            'Ticker not found. For non-US stocks, use format: TICKER.EXCHANGE (e.g., BMW.DE, AIR.PA)',
        };
      }

      return { valid: true, exchangeName: response.exchange };
    } catch (error: any) {
      console.error('Error validating ticker:', error);
      if (error.status === 429) {
        return { valid: false, error: 'Rate limit reached. Please try again later.' };
      }
      if (error.status === 403 || error.error?.message?.includes('access')) {
        return {
          valid: false,
          error:
            'API access denied. Please verify your Finnhub API key in environment.development.ts',
        };
      }
      const errorMsg = error.error?.message || error.message || 'Unknown error';
      return {
        valid: false,
        error: `Failed to validate ticker: ${errorMsg}. Try format: TICKER or TICKER.EXCHANGE`,
      };
    }
  }

  async refreshPrice(ticker: string): Promise<InvestmentCurrentPrice> {
    try {
      // Check if ticker contains exchange suffix
      const hasExchange = ticker.includes('.');

      if (hasExchange) {
        // For international tickers, check if we have a cached price first
        const cachedPrice = await this.getCurrentPrice(ticker);
        if (cachedPrice) {
          console.info(`Using cached price for ${ticker} (Finnhub free tier doesn't support this exchange)`);
          return cachedPrice;
        }
        
        // No cached price available - user will need to add it manually
        throw new Error(
          `${ticker} requires manual price entry. Finnhub free tier doesn't support this exchange.`
        );
      }

      // For US tickers, use Finnhub API
      const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${environment.finnhub.apiKey}`;

      const response = await firstValueFrom(this.http.get<FinnhubQuoteResponse>(url));

      // Check if we got valid data (c is current price)
      if (!response || response.c === 0) {
        throw new Error(`No data available for ${ticker}. Try format: TICKER or TICKER.EXCHANGE`);
      }

      // Get profile for exchange info
      const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${environment.finnhub.apiKey}`;
      const profile = await firstValueFrom(this.http.get<FinnhubProfileResponse>(profileUrl));

      const priceData: Omit<InvestmentCurrentPrice, 'last_updated'> = {
        ticker: ticker.toUpperCase(),
        price: response.c, // Current price
        currency: profile?.currency || 'USD',
        exchange_name: profile?.exchange || undefined,
      };

      const { data, error } = await this.supabase.client
        .from('investment_current_prices')
        .upsert(priceData, { onConflict: 'ticker' })
        .select();

      if (error) {
        console.error('Error saving price:', error);
        throw new Error(error.message);
      }

      // Upsert returns an array, get first item
      return data && data.length > 0 ? data[0] : priceData as InvestmentCurrentPrice;
    } catch (error: any) {
      console.error('Error refreshing price:', error);
      if (error.status === 429) {
        throw new Error(`Rate limit reached for ${ticker}. Please try again later.`);
      }
      if (error.status === 403 || error.error?.message?.includes('access')) {
        throw new Error(`API access denied for ${ticker}. Please verify your Finnhub API key.`);
      }
      const errorMsg = error.error?.message || error.message || 'Unknown error';
      throw new Error(`Failed to fetch price for ${ticker}: ${errorMsg}`);
    }
  }

  // ========== Portfolio Calculations ==========

  async getPortfolioSummary(forceRefresh: boolean = false): Promise<PortfolioSummary> {
    try {
      // Get all transactions
      const { data: transactions } = await this.getTransactions({ pageSize: 10000 });

      console.log('💼 Getting portfolio summary, transactions:', transactions?.length);

      if (!transactions || transactions.length === 0) {
        console.log('⚠️ No transactions found');
        return {
          holdings: [],
          totalValue: 0,
          totalCost: 0,
          totalGainLoss: 0,
          totalGainLossPercent: 0,
        };
      }

      // Group transactions by ticker and calculate net position
      const positionMap = new Map<
        string,
        { totalQuantity: number; totalCost: number; transactions: InvestmentTransaction[] }
      >();

      for (const tx of transactions) {
        const existing = positionMap.get(tx.ticker) || {
          totalQuantity: 0,
          totalCost: 0,
          transactions: [],
        };

        if (tx.transaction_type === 'BUY') {
          existing.totalQuantity += tx.quantity;
          existing.totalCost += tx.quantity * tx.purchase_price;
        } else if (tx.transaction_type === 'SELL') {
          existing.totalQuantity -= tx.quantity;
          // For sold shares, reduce cost proportionally
          const avgCost = existing.totalCost / (existing.totalQuantity + tx.quantity);
          existing.totalCost -= tx.quantity * avgCost;
        }

        existing.transactions.push(tx);
        positionMap.set(tx.ticker, existing);
      }

      // Get current prices for all tickers
      const tickers = Array.from(positionMap.keys());
      const pricePromises = tickers.map(async (ticker) => {
        let price = await this.getCurrentPrice(ticker);

        // If price doesn't exist or is stale (> 15 minutes) and forceRefresh is true
        if (forceRefresh || !price || this.isPriceStale(price.last_updated)) {
          try {
            price = await this.refreshPrice(ticker);
          } catch (error: any) {
            const errorMsg = error?.message || String(error);
            console.info(`Could not refresh price for ${ticker}: ${errorMsg}`);
            // If refresh fails, use the cached price or last transaction price
            if (!price) {
              // Use the most recent transaction price as fallback
              const position = positionMap.get(ticker);
              const lastTx = position?.transactions[0]; // transactions are sorted by date desc
              if (lastTx) {
                console.info(`Using last transaction price for ${ticker}: €${lastTx.purchase_price}`);
                price = {
                  ticker: ticker,
                  price: lastTx.purchase_price,
                  currency: 'EUR',
                  exchange_name: undefined,
                  last_updated: lastTx.transaction_date
                };
              }
            }
          }
        }

        return { ticker, price: price?.price || 0 };
      });

      const prices = await Promise.all(pricePromises);
      const priceMap = new Map(prices.map((p) => [p.ticker, p.price]));

      // Calculate holdings
      const holdings: PortfolioHolding[] = [];
      let totalValue = 0;
      let totalCost = 0;

      for (const [ticker, position] of positionMap.entries()) {
        // Skip positions with zero or negative quantity
        if (position.totalQuantity <= 0) {
          continue;
        }

        const currentPrice = priceMap.get(ticker) || 0;
        const averageCost = position.totalCost / position.totalQuantity;
        const currentValue = position.totalQuantity * currentPrice;
        const gainLoss = currentValue - position.totalCost;
        const gainLossPercent = position.totalCost > 0 ? (gainLoss / position.totalCost) * 100 : 0;

        // Get exchange from the first transaction
        const exchange = position.transactions[0]?.ticker
          ? await this.getExchangeForTicker(ticker)
          : undefined;

        holdings.push({
          ticker,
          totalQuantity: position.totalQuantity,
          averageCost,
          currentPrice,
          totalCost: position.totalCost,
          currentValue,
          gainLoss,
          gainLossPercent,
          exchange,
          country: exchange ? this.mapExchangeToCountry(exchange) : undefined,
        });

        totalValue += currentValue;
        totalCost += position.totalCost;
      }

      const totalGainLoss = totalValue - totalCost;
      const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

      const summary = {
        holdings: holdings.sort((a, b) => b.currentValue - a.currentValue),
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
      };

      console.log('📈 Portfolio summary calculated:', {
        holdingsCount: summary.holdings.length,
        totalValue: summary.totalValue,
        totalCost: summary.totalCost
      });

      return summary;
    } catch (error) {
      console.error('❌ Error calculating portfolio summary:', error);
      throw error;
    }
  }

  async getGeographicalAllocation(
    forceRefresh: boolean = false
  ): Promise<GeographicalAllocation[]> {
    try {
      const summary = await this.getPortfolioSummary(forceRefresh);

      if (!summary.holdings || summary.holdings.length === 0) {
        return [];
      }

      // Group by country
      const countryMap = new Map<string, number>();

      for (const holding of summary.holdings) {
        const country = holding.country || 'Unknown';
        const existingValue = countryMap.get(country) || 0;
        countryMap.set(country, existingValue + holding.currentValue);
      }

      // Convert to array and calculate percentages
      const allocations: GeographicalAllocation[] = [];
      for (const [country, value] of countryMap.entries()) {
        allocations.push({
          country,
          value,
          percentage: summary.totalValue > 0 ? (value / summary.totalValue) * 100 : 0,
        });
      }

      return allocations.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error('Error calculating geographical allocation:', error);
      throw error;
    }
  }

  async getUniqueTickers(): Promise<string[]> {
    const { data, error } = await this.supabase.client
      .from('investment_transactions')
      .select('ticker')
      .order('ticker');

    if (error) {
      console.error('Error fetching unique tickers:', error);
      return [];
    }

    // Get unique tickers
    const uniqueTickers = [...new Set(data.map((t) => t.ticker))];
    return uniqueTickers;
  }

  // ========== Helper Methods ==========

  private isPriceStale(lastUpdated: string): boolean {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMinutes = (now.getTime() - updated.getTime()) / (1000 * 60);
    return diffMinutes > 15; // Consider stale if older than 15 minutes
  }

  private async getExchangeForTicker(ticker: string): Promise<string | undefined> {
    const price = await this.getCurrentPrice(ticker);
    return price?.exchange_name;
  }

  private mapExchangeToCountry(exchange: string): string {
    return EXCHANGE_COUNTRY_MAP[exchange] || 'Other';
  }
}
