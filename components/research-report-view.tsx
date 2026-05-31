"use client";

import { useState, useCallback } from "react";
import {
  Loader2,
  Play,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getResearchReport,
  requestResearchAnalysis,
} from "@/lib/actions/research.actions";
import type {
  FullResearchReport,
  Signal,
  AgentFinding,
  NewsAgentReport,
  FundamentalsAgentReport,
  TechnicalAgentReport,
  SynthesizerReport,
} from "@/lib/inngest/agents";

type Props = {
  symbol: string;
  initialReport: FullResearchReport | null;
};

export function ResearchReportView({ symbol, initialReport }: Props) {
  const [report, setReport] = useState<FullResearchReport | null>(initialReport);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRunAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setStatusMessage("Dispatching analysis…");

    const initialTimestamp = report?.generatedAt;
    const result = await requestResearchAnalysis(symbol);

    if (!result.success) {
      setStatusMessage(result.message);
      setIsAnalyzing(false);
      return;
    }

    setStatusMessage(
      "Agents working — fanning out 5 data fetches + 3 specialist analyses in parallel…"
    );

    let elapsed = 0;
    const interval = setInterval(async () => {
      elapsed += 5;
      const latest = await getResearchReport(symbol);

      if (latest && latest.generatedAt !== initialTimestamp) {
        setReport(latest);
        setIsAnalyzing(false);
        setStatusMessage(null);
        clearInterval(interval);
        return;
      }

      if (elapsed >= 120) {
        clearInterval(interval);
        setIsAnalyzing(false);
        setStatusMessage(
          "Analysis is taking longer than expected. Refresh in a minute."
        );
      }
    }, 5000);
  }, [symbol, report]);

  if (!report && !isAnalyzing) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
        <h3 className="text-lg font-semibold">No analysis yet</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Run the multi-agent research pipeline to generate an analysis for{" "}
          {symbol}.
        </p>
        <Button
          onClick={handleRunAnalysis}
          className="mt-6 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
        >
          <Play className="mr-2 h-4 w-4" />
          Run Analysis
        </Button>
      </div>
    );
  }

  if (!report && isAnalyzing) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-500" />
        <h3 className="mt-4 text-lg font-semibold">Analyzing {symbol}…</h3>
        <p className="mt-1 text-sm text-zinc-400">{statusMessage}</p>
        <p className="mt-3 text-xs text-zinc-600">
          Running news, fundamentals, and technical agents in parallel
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ReportHeader report={report!} />

      <div className="flex items-center gap-3">
        <Button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          variant="outline"
          className="border-zinc-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Regenerating…
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate Analysis
            </>
          )}
        </Button>
        {statusMessage && (
          <span className="text-sm text-zinc-400">{statusMessage}</span>
        )}
      </div>

      <SynthesisCard synthesis={report!.synthesis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <NewsCard report={report!.news} />
        <FundamentalsCard report={report!.fundamentals} />
        <TechnicalCard report={report!.technical} />
      </div>

      <p className="text-center text-xs text-zinc-600">
        AI-generated analysis. Not financial advice. Generated{" "}
        {formatTime(report!.generatedAt)}.
      </p>
    </div>
  );
}

function ReportHeader({ report }: { report: FullResearchReport }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{report.companyName}</h2>
          <p className="text-sm text-zinc-400">{report.symbol}</p>
        </div>
        <SignalBadge
          signal={report.synthesis.overallSignal}
          confidence={report.synthesis.confidence}
          large
        />
      </div>
    </div>
  );
}

function SynthesisCard({ synthesis }: { synthesis: SynthesizerReport }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
      <div className="mb-3 flex items-center gap-2">
        <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
          Synthesis
        </Badge>
        <span className="text-xs text-zinc-500">
          Confidence {Math.round(synthesis.confidence * 100)}%
        </span>
      </div>

      <p className="text-base leading-relaxed text-zinc-100">
        {synthesis.thesis}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <PointList
          title="Bullish"
          points={synthesis.bullishPoints}
          color="emerald"
        />
        <PointList
          title="Bearish"
          points={synthesis.bearishPoints}
          color="red"
        />
        <PointList
          title="Watch"
          points={synthesis.watchPoints}
          color="amber"
        />
      </div>

      <div className="mt-6 border-t border-emerald-500/10 pt-4">
        <p className="text-xs uppercase tracking-wider text-zinc-500">
          Analyst Consensus
        </p>
        <p className="mt-1 text-sm text-zinc-300">{synthesis.analystConsensus}</p>
      </div>
    </div>
  );
}

function PointList({
  title,
  points,
  color,
}: {
  title: string;
  points: string[];
  color: "emerald" | "red" | "amber";
}) {
  const colorClasses = {
    emerald: "text-emerald-400",
    red: "text-red-400",
    amber: "text-amber-400",
  };

  return (
    <div>
      <h4
        className={`text-xs font-semibold uppercase tracking-wider ${colorClasses[color]}`}
      >
        {title}
      </h4>
      <ul className="mt-2 space-y-1.5">
        {points.length === 0 ? (
          <li className="text-sm text-zinc-600">—</li>
        ) : (
          points.map((point, i) => (
            <li key={i} className="text-sm leading-snug text-zinc-300">
              • {point}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function NewsCard({ report }: { report: NewsAgentReport }) {
  return (
    <AgentCard
      title="News Analyst"
      signal={report.signal}
      confidence={report.confidence}
      summary={report.summary}
      findings={report.findings}
      footer={`Analyzed ${report.articleCount} article${
        report.articleCount === 1 ? "" : "s"
      }`}
    />
  );
}

function FundamentalsCard({ report }: { report: FundamentalsAgentReport }) {
  const showcase = [
    { label: "P/E (TTM)", key: "peTTM" },
    { label: "ROE", key: "roeTTM" },
    { label: "Gross Margin", key: "grossMarginTTM" },
  ];

  const customFooter = (
    <div className="grid grid-cols-3 gap-2 text-xs">
      {showcase.map((m) => {
        const val = report.keyMetrics[m.key];
        return (
          <div key={m.key} className="rounded bg-zinc-800/50 p-2">
            <p className="text-zinc-500">{m.label}</p>
            <p className="font-mono font-semibold text-zinc-100">
              {typeof val === "number" ? val.toFixed(2) : val ?? "N/A"}
            </p>
          </div>
        );
      })}
    </div>
  );

  return (
    <AgentCard
      title="Fundamentals Analyst"
      signal={report.signal}
      confidence={report.confidence}
      summary={report.summary}
      findings={report.findings}
      customFooter={customFooter}
    />
  );
}

function TechnicalCard({ report }: { report: TechnicalAgentReport }) {
  const customFooter = (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="rounded bg-zinc-800/50 p-2">
        <p className="text-zinc-500">Current</p>
        <p className="font-mono font-semibold text-zinc-100">
          ${report.priceContext.current.toFixed(2)}
        </p>
      </div>
      <div className="rounded bg-zinc-800/50 p-2">
        <p className="text-zinc-500">Day Change</p>
        <p
          className={`font-mono font-semibold ${
            report.priceContext.dayChangePercent >= 0
              ? "text-emerald-400"
              : "text-red-400"
          }`}
        >
          {report.priceContext.dayChangePercent >= 0 ? "+" : ""}
          {report.priceContext.dayChangePercent.toFixed(2)}%
        </p>
      </div>
    </div>
  );

  return (
    <AgentCard
      title="Technical Analyst"
      signal={report.signal}
      confidence={report.confidence}
      summary={report.summary}
      findings={report.findings}
      customFooter={customFooter}
    />
  );
}

function AgentCard({
  title,
  signal,
  confidence,
  summary,
  findings,
  footer,
  customFooter,
}: {
  title: string;
  signal: Signal;
  confidence: number;
  summary: string;
  findings: AgentFinding[];
  footer?: string;
  customFooter?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <SignalBadge signal={signal} confidence={confidence} />
      </div>

      <p className="mb-4 text-sm leading-relaxed text-zinc-300">{summary}</p>

      <div className="flex-1 space-y-3">
        {findings.map((f, i) => (
          <div key={i} className="border-l-2 border-zinc-700 pl-3">
            <p className="text-sm font-medium text-zinc-100">{f.point}</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {f.evidence}
            </p>
          </div>
        ))}
      </div>

      {customFooter && (
        <div className="mt-4 border-t border-zinc-800 pt-4">{customFooter}</div>
      )}

      {footer && !customFooter && (
        <p className="mt-4 border-t border-zinc-800 pt-4 text-xs text-zinc-600">
          {footer}
        </p>
      )}
    </div>
  );
}

function SignalBadge({
  signal,
  confidence,
  large = false,
}: {
  signal: Signal;
  confidence: number;
  large?: boolean;
}) {
  const config = {
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

  const { label, icon: Icon, classes } = config[signal];

  if (large) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border px-4 py-2 ${classes}`}
      >
        <Icon className="h-5 w-5" />
        <div>
          <p className="font-bold leading-none">{label}</p>
          <p className="mt-0.5 text-xs opacity-80">
            Confidence {Math.round(confidence * 100)}%
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold ${classes}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}