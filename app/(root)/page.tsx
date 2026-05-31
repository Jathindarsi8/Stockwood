import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { MarketOverviewWidget } from "@/components/widgets/market-overview-widget";
import { DashboardWatchlist } from "@/components/dashboard-watchlist";
import { StockHeatmapWidget } from "@/components/widgets/stock-heatmap-widget";
import { TopStoriesWidget } from "@/components/widgets/top-stories-widget";
import { MarketQuotesWidget } from "@/components/widgets/market-quotes-widget";
import { LatestAnalysisHero } from "@/components/latest-analysis-hero";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hi {firstName}</h1>
        <p className="mt-1 text-zinc-400">Your AI-powered market intelligence dashboard.</p>
      </div>

      <LatestAnalysisHero />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Your Watchlist</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Click any stock for multi-agent AI research</p>
          </div>
          <a href="/watchlist" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">Manage</a>
        </div>
        <DashboardWatchlist />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Market Pulse</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <DashboardCard title="Market Overview" className="lg:col-span-2"><MarketOverviewWidget /></DashboardCard>
          <DashboardCard title="Top Stories"><TopStoriesWidget /></DashboardCard>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Market Movement</h2>
        <div className="grid grid-cols-1 gap-6">
          <DashboardCard title="Sector Heatmap"><StockHeatmapWidget /></DashboardCard>
          <DashboardCard title="Quote Tickers"><MarketQuotesWidget /></DashboardCard>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string; }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/30 p-1 ${className}`}>
      <div className="border-b border-zinc-800 px-4 py-3"><h3 className="text-sm font-semibold text-zinc-300">{title}</h3></div>
      <div className="p-1">{children}</div>
    </div>
  );
}
