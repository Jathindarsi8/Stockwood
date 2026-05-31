"use server";

import { searchSymbols } from "@/lib/finnhub";

export type StockSearchResult = {
  symbol: string;
  description: string;
  displaySymbol: string;
};

export async function searchStocks(
  query: string
): Promise<StockSearchResult[]> {
  if (!query || query.trim().length < 1) return [];

  try {
    const results = await searchSymbols(query.trim());

    return results
      .filter(
        (r) =>
          // Keep common stocks; Finnhub uses "Common Stock" or empty type
          r.type === "Common Stock" || r.type === ""
      )
      .slice(0, 10)
      .map((r) => ({
        symbol: r.symbol,
        description: r.description,
        displaySymbol: r.displaySymbol,
      }));
  } catch (err) {
    console.error("Stock search failed:", err);
    return [];
  }
}