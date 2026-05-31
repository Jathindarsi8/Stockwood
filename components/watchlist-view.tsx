"use client";

import { useState } from "react";
import { Trash2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  removeFromWatchlist,
  getWatchlist,
} from "@/lib/actions/watchlist.actions";
import type { WatchlistItem } from "@/lib/actions/watchlist.actions";
import { WatchlistSearch } from "@/components/watchlist-search";

type Props = {
  initialItems: WatchlistItem[];
};

export function WatchlistView({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [removing, setRemoving] = useState<string | null>(null);

  const refresh = async () => {
    const fresh = await getWatchlist();
    setItems(fresh);
  };

  const handleRemove = async (symbol: string) => {
    setRemoving(symbol);
    await removeFromWatchlist(symbol);
    setItems((prev) => prev.filter((i) => i.symbol !== symbol));
    setRemoving(null);
  };

  return (
    <div className="space-y-6">
      <WatchlistSearch onAdded={refresh} />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
          <TrendingUp className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <h3 className="text-lg font-semibold">No stocks yet</h3>
          <p className="mt-1 text-sm text-zinc-400">
            Search above to add your first stock. Your daily digest will then
            focus on the news for your picks.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {items.length} {items.length === 1 ? "stock" : "stocks"}
          </p>
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            {items.map((item, idx) => (
              <div
                key={item.symbol}
                className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-zinc-900/50 ${
                  idx !== items.length - 1 ? "border-b border-zinc-800" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/5 font-mono text-emerald-400"
                  >
                    {item.symbol}
                  </Badge>
                  <span className="text-sm text-zinc-300">{item.company}</span>
                  <Link
  href={`/stocks/${item.symbol}`}
  className="flex items-center gap-4 transition-opacity hover:opacity-80"
>
  <Badge
    variant="outline"
    className="border-emerald-500/30 bg-emerald-500/5 font-mono text-emerald-400"
  >
    {item.symbol}
  </Badge>
  <span className="text-sm text-zinc-300">{item.company}</span>
</Link>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(item.symbol)}
                  disabled={removing === item.symbol}
                  className="text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}