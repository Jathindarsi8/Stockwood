import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SymbolInfoWidget } from "@/components/widgets/symbol-info-widget";
import { AdvancedChartWidget } from "@/components/widgets/advanced-chart-widget";
import { TechnicalAnalysisWidget } from "@/components/widgets/technical-analysis-widget";
import { FinancialsWidget } from "@/components/widgets/financials-widget";
import { getResearchReport } from "@/lib/actions/research.actions";
import { ResearchReportView } from "@/components/research-report-view";

type Props = {
  params: Promise<{ symbol: string }>;
};

export default async function StockDetailPage({ params }: Props) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  const initialReport = await getResearchReport(upper);

  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{upper}</h1>
        <p className="mt-1 text-zinc-400">
          Live chart, AI multi-agent research, technical analysis, and financials.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <SymbolInfoWidget symbol={upper} />
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-1">
        <div className="border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-300">Price Chart</h2>
        </div>
        <div className="p-1">
          <AdvancedChartWidget symbol={upper} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-emerald-500/20" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            AI Multi-Agent Research
          </h2>
          <div className="h-px flex-1 bg-emerald-500/20" />
        </div>

        <ResearchReportView symbol={upper} initialReport={initialReport} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-1">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-300">
              Technical Analysis
            </h2>
          </div>
          <div className="p-1">
            <TechnicalAnalysisWidget symbol={upper} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-1">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-sm font-semibold text-zinc-300">Financials</h2>
          </div>
          <div className="p-1">
            <FinancialsWidget symbol={upper} />
          </div>
        </div>
      </div>
    </div>
  );
}