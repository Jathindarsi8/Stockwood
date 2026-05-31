"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Check, Loader2 } from "lucide-react";
import {
  searchStocks,
  type StockSearchResult,
} from "@/lib/actions/finnhub.actions";
import { addToWatchlist } from "@/lib/actions/watchlist.actions";

type Props = {
  onAdded: () => void | Promise<void>;
};

export function WatchlistSearch({ onAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Debounced search with deduplication
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchStocks(query);
        // Dedupe by symbol — Finnhub returns same ticker for multiple exchanges
        const seen = new Set<string>();
        const unique = res.filter((r) => {
          if (seen.has(r.symbol)) return false;
          seen.add(r.symbol);
          return true;
        });
        setResults(unique);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = async (item: StockSearchResult) => {
    setAdding(item.symbol);
    await addToWatchlist(item.symbol, item.description);
    setAdded((prev) => new Set(prev).add(item.symbol));
    setAdding(null);
    await onAdded();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search stocks (e.g. Apple, NVDA)..."
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/40 focus:outline-none"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl">
          {searching ? (
            <div className="flex items-center gap-2 p-4 text-sm text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500">
              No results. Try a different ticker or company name.
            </div>
          ) : (
            <ul>
              {results.map((item, index) => {
                const isAdded = added.has(item.symbol);
                const isAdding = adding === item.symbol;
                return (
                  <li
                    key={`${item.symbol}-${index}`}
                    className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 last:border-b-0 hover:bg-zinc-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/5 px-2 py-0.5 font-mono text-xs text-emerald-400">
                        {item.symbol}
                      </span>
                      <span className="text-sm text-zinc-300">
                        {item.description}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAdd(item)}
                      disabled={isAdding || isAdded}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 disabled:opacity-50"
                    >
                      {isAdded ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" /> Added
                        </>
                      ) : isAdding ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" /> Adding
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" /> Add
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}