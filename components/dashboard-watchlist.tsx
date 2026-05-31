import Link from "next/link";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getWatchlist } from "@/lib/actions/watchlist.actions";
import { getWatchlistSignals } from "@/lib/actions/research.actions";

export async function DashboardWatchlist() {
  const [items, signals] = await Promise.all([
    getWatchlist(),
    getWatchlistSignals(),
  ]);

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
        <TrendingUp className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
        <p className="text-sm text-zinc-400">
          No stocks in your watchlist yet.{" "}
          <Link
            href="/watchlist"
            className="font-semibold text-emerald-400 hover:text-emerald-300"
          >
            Add some →
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => {
        const signal = signals[item.symbol];
        return (
          <Link
            key={item.symbol}
            href={`/stocks/${item.symbol}`}
            className="group flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
          >
            <div className="flex items-start justify-between">
              <div className="font-mono text-lg font-bold text-emerald-400">
                {item.symbol}
              </div>
              {signal ? (
                <SignalBadge signal={signal.signal} confidence={signal.confidence} />
              ) : (
                <div className="flex items-center gap-1 rounded-md bg-zinc-800/50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                  <Sparkles className="h-3 w-3" />
                  AI Ready
                </div>
              )}
            </div>
            <div className="mt-2 line-clamp-2 text-xs text-zinc-400">
              {item.company}
            </div>
            <div className="mt-4 text-[11px] text-zinc-500 group-hover:text-emerald-400">
              {signal ? "View analysis →" : "Run analysis →"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function SignalBadge({
  signal,
  confidence,
}: {
  signal: "bullish" | "neutral" | "bearish";
  confidence: number;
}) {
  const config = {
    bullish: {
      label: "BULL",
      icon: TrendingUp,
      classes: "bg-emerald-500/20 text-emerald-400",
    },
    neutral: {
      label: "NEUT",
      icon: Minus,
      classes: "bg-zinc-700/50 text-zinc-300",
    },
    bearish: {
      label: "BEAR",
      icon: TrendingDown,
      classes: "bg-red-500/20 text-red-400",
    },
  };

  const { label, icon: Icon, classes } = config[signal];

  return (
    <div
      className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${classes}`}
      title={`Confidence ${Math.round(confidence * 100)}%`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}