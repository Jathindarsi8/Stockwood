import Link from "next/link";
import { Sparkles, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getLatestResearchReport } from "@/lib/actions/research.actions";

export async function LatestAnalysisHero() {
  const report = await getLatestResearchReport();

  if (!report) return null;

  const signal = report.synthesis.overallSignal;
  const signalConfig = {
    bullish: {
      label: "BULLISH",
      icon: TrendingUp,
      classes: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    neutral: {
      label: "NEUTRAL",
      icon: Minus,
      classes: "bg-zinc-700/50 text-zinc-300 border-zinc-600",
    },
    bearish: {
      label: "BEARISH",
      icon: TrendingDown,
      classes: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

  const { label, icon: Icon, classes } = signalConfig[signal];

  return (
    <Link
      href={`/stocks/${report.symbol}`}
      className="group block rounded-xl border border-emerald-500/20 bg-linear-to-br from-emerald-500/10 via-zinc-900/40 to-zinc-900/40 p-6 transition-all hover:border-emerald-500/40"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              Latest AI Analysis
            </div>
            <span className="text-xs text-zinc-500">
              {formatTime(report.generatedAt)}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h2 className="text-2xl font-bold text-zinc-100">
              {report.companyName}
            </h2>
            <span className="font-mono text-sm text-emerald-400">
              {report.symbol}
            </span>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-300">
            {report.synthesis.thesis}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">
            Read full multi-agent research
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        <div
          className={`flex flex-col items-center gap-2 rounded-lg border px-5 py-3 ${classes}`}
        >
          <Icon className="h-6 w-6" />
          <span className="text-sm font-bold">{label}</span>
          <span className="text-[10px] opacity-80">
            {Math.round(report.synthesis.confidence * 100)}% conf
          </span>
        </div>
      </div>
    </Link>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}