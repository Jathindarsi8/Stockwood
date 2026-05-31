const FINNHUB_BASE = "https://finnhub.io/api/v1";

export type FinnhubNewsArticle = {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const today = () => isoDate(new Date());

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
};

const requireKey = () => {
  if (!process.env.FINNHUB_API_KEY) {
    throw new Error("FINNHUB_API_KEY is not set");
  }
  return process.env.FINNHUB_API_KEY;
};

/**
 * Fetches the latest news for a specific stock symbol (last 2 days).
 * Used for personalized digests when a user has a watchlist.
 */
export const getCompanyNews = async (
  symbol: string,
  limit: number = 5
): Promise<FinnhubNewsArticle[]> => {
  const key = requireKey();
  const from = daysAgo(2);
  const to = today();

  const url = `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(
    symbol
  )}&from=${from}&to=${to}&token=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Finnhub company-news error ${res.status} for ${symbol}: ${text}`
    );
  }

  const data = (await res.json()) as FinnhubNewsArticle[];

  // Finnhub returns articles sorted newest-first; cap to `limit` to keep prompts small
  return Array.isArray(data) ? data.slice(0, limit) : [];
};

/**
 * Fetches general market news. Used as fallback when a user's watchlist is empty.
 */
export const getMarketNews = async (
  limit: number = 10
): Promise<FinnhubNewsArticle[]> => {
  const key = requireKey();

  const url = `${FINNHUB_BASE}/news?category=general&token=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Finnhub market-news error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as FinnhubNewsArticle[];
  return Array.isArray(data) ? data.slice(0, limit) : [];
};

/**
 * Search for stock symbols by name or ticker.
 * Used later by the Watchlist UI (Step 5).
 */
export type FinnhubSymbolMatch = {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
};

export const searchSymbols = async (
  query: string
): Promise<FinnhubSymbolMatch[]> => {
  const key = requireKey();

  const url = `${FINNHUB_BASE}/search?q=${encodeURIComponent(
    query
  )}&token=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Finnhub search error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    count: number;
    result: FinnhubSymbolMatch[];
  };

  return data.result || [];
};

// ============================================================
// Additional helpers for multi-agent analysis (Step 7)
// ============================================================

export type CompanyProfile = {
  name: string;
  ticker: string;
  exchange: string;
  industry: string;
  marketCapitalization: number;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
};

export const getCompanyProfile = async (
  symbol: string
): Promise<CompanyProfile | null> => {
  const key = requireKey();
  const url = `${FINNHUB_BASE}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub profile error ${res.status}`);
  }

  const data = (await res.json()) as CompanyProfile;
  if (!data || !data.name) return null;
  return data;
};

export type BasicFinancials = {
  metric: Record<string, number | string | null>;
  metricType: string;
  series: Record<string, unknown>;
  symbol: string;
};

export const getBasicFinancials = async (
  symbol: string
): Promise<BasicFinancials | null> => {
  const key = requireKey();
  const url = `${FINNHUB_BASE}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub financials error ${res.status}`);
  }

  const data = (await res.json()) as BasicFinancials;
  return data;
};

export type Quote = {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high of day
  l: number; // low of day
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
};

export const getQuote = async (symbol: string): Promise<Quote> => {
  const key = requireKey();
  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub quote error ${res.status}`);
  }
  return (await res.json()) as Quote;
};

export type RecommendationTrend = {
  buy: number;
  hold: number;
  period: string; // YYYY-MM-DD
  sell: number;
  strongBuy: number;
  strongSell: number;
  symbol: string;
};

export const getRecommendationTrends = async (
  symbol: string
): Promise<RecommendationTrend[]> => {
  const key = requireKey();
  const url = `${FINNHUB_BASE}/stock/recommendation?symbol=${encodeURIComponent(symbol)}&token=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub recommendations error ${res.status}`);
  }
  const data = (await res.json()) as RecommendationTrend[];
  return Array.isArray(data) ? data : [];
};