import type {
  FinnhubNewsArticle,
  BasicFinancials,
  Quote,
  RecommendationTrend,
  CompanyProfile,
} from "@/lib/finnhub";

// ============================================================
// Shared structured output schema
// ============================================================

export type Signal = "bullish" | "neutral" | "bearish";

export type AgentFinding = {
  point: string;
  evidence: string;
};

export type NewsAgentReport = {
  agent: "news";
  signal: Signal;
  confidence: number;
  summary: string;
  findings: AgentFinding[];
  articleCount: number;
};

export type FundamentalsAgentReport = {
  agent: "fundamentals";
  signal: Signal;
  confidence: number;
  summary: string;
  findings: AgentFinding[];
  keyMetrics: Record<string, string | number>;
};

export type TechnicalAgentReport = {
  agent: "technical";
  signal: Signal;
  confidence: number;
  summary: string;
  findings: AgentFinding[];
  priceContext: {
    current: number;
    dayChange: number;
    dayChangePercent: number;
  };
};

export type SynthesizerReport = {
  agent: "synthesizer";
  overallSignal: Signal;
  confidence: number;
  thesis: string;
  bullishPoints: string[];
  bearishPoints: string[];
  watchPoints: string[];
  analystConsensus: string;
};

export type FullResearchReport = {
  symbol: string;
  companyName: string;
  generatedAt: string;
  news: NewsAgentReport;
  fundamentals: FundamentalsAgentReport;
  technical: TechnicalAgentReport;
  synthesis: SynthesizerReport;
};

// ============================================================
// Gemini caller — shared, with JSON-mode enforcement
// ============================================================

  const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";    

async function callGeminiJSON<T>(
  systemPrompt: string,
  userPrompt: string,
  schemaHint: string
): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const fullPrompt = `${systemPrompt}

${userPrompt}

CRITICAL: Respond with ONLY a valid JSON object matching this exact shape:
${schemaHint}

No markdown code fences. No "Here is the JSON". Just the raw JSON object starting with { and ending with }.`;

  const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Gemini returned no text");

  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Failed to parse agent response as JSON. Raw: ${cleaned.slice(0, 500)}`
    );
  }
}

// ============================================================
// Agent 1 — News Analyzer
// ============================================================

export async function runNewsAgent(
  symbol: string,
  companyName: string,
  articles: FinnhubNewsArticle[]
): Promise<NewsAgentReport> {
  if (articles.length === 0) {
    return {
      agent: "news",
      signal: "neutral",
      confidence: 0.2,
      summary: `No recent news available for ${symbol} in the last 2 days.`,
      findings: [],
      articleCount: 0,
    };
  }

  const headlines = articles
    .map(
      (a, i) =>
        `[${i + 1}] ${a.headline} — ${a.source}\n${a.summary.slice(0, 240)}`
    )
    .join("\n\n");

  const systemPrompt = `You are a financial news analyst specializing in equity research. You read recent news headlines and summaries for a specific company and produce a structured sentiment assessment. You cite specific articles by their bracketed number.`;

  const userPrompt = `Company: ${companyName} (${symbol})

Recent news (last 2 days):
${headlines}

Assess sentiment and surface the 2-4 most material findings. For each finding, cite which article supports it (e.g. "per article [2]").`;

  const schemaHint = `{
  "agent": "news",
  "signal": "bullish" | "neutral" | "bearish",
  "confidence": <0.0 to 1.0>,
  "summary": "<2-3 sentence overall sentiment summary>",
  "findings": [
    { "point": "<1-sentence insight>", "evidence": "<what backs it up, with article citations>" }
  ],
  "articleCount": ${articles.length}
}`;

  const result = await callGeminiJSON<NewsAgentReport>(
    systemPrompt,
    userPrompt,
    schemaHint
  );
  result.agent = "news";
  result.articleCount = articles.length;
  return result;
}

// ============================================================
// Agent 2 — Fundamentals
// ============================================================

export async function runFundamentalsAgent(
  symbol: string,
  companyName: string,
  profile: CompanyProfile | null,
  financials: BasicFinancials | null
): Promise<FundamentalsAgentReport> {
  if (!financials?.metric) {
    return {
      agent: "fundamentals",
      signal: "neutral",
      confidence: 0.1,
      summary: `Fundamentals data unavailable for ${symbol}.`,
      findings: [],
      keyMetrics: {},
    };
  }

  const m = financials.metric;
  const keyMetrics: Record<string, string | number> = {
    peTTM: (m.peTTM as number) ?? "N/A",
    psAnnual: (m.psAnnual as number) ?? "N/A",
    pbAnnual: (m.pbAnnual as number) ?? "N/A",
    epsTTM: (m.epsAnnual as number) ?? "N/A",
    roeTTM: (m.roeTTM as number) ?? "N/A",
    grossMarginTTM: (m.grossMarginTTM as number) ?? "N/A",
    netMarginTTM: (m.netProfitMarginTTM as number) ?? "N/A",
    debtToEquity: (m["totalDebt/totalEquityAnnual"] as number) ?? "N/A",
    revenueGrowthTTM: (m.revenueGrowthTTMYoy as number) ?? "N/A",
    "52WeekHigh": (m["52WeekHigh"] as number) ?? "N/A",
    "52WeekLow": (m["52WeekLow"] as number) ?? "N/A",
  };

  const metricsText = Object.entries(keyMetrics)
    .map(([k, v]) => `- ${k}: ${typeof v === "number" ? v.toFixed(2) : v}`)
    .join("\n");

  const systemPrompt = `You are a fundamentals analyst. You evaluate a company's financial health using key ratios and metrics, and produce a bullish/neutral/bearish assessment with specific evidence.`;

  const userPrompt = `Company: ${companyName} (${symbol})
Industry: ${profile?.finnhubIndustry ?? "Unknown"}
Market Cap: ${profile?.marketCapitalization ? `$${(profile.marketCapitalization / 1000).toFixed(1)}B` : "Unknown"}

Key metrics (TTM = trailing twelve months):
${metricsText}

Assess financial health. Reference specific metrics in your findings.`;

  const schemaHint = `{
  "agent": "fundamentals",
  "signal": "bullish" | "neutral" | "bearish",
  "confidence": <0.0 to 1.0>,
  "summary": "<2-3 sentence overall fundamentals view>",
  "findings": [
    { "point": "<1-sentence insight>", "evidence": "<specific metric values that back it>" }
  ],
  "keyMetrics": { "peTTM": <value>, "roeTTM": <value> }
}`;

  const result = await callGeminiJSON<FundamentalsAgentReport>(
    systemPrompt,
    userPrompt,
    schemaHint
  );
  result.agent = "fundamentals";
  result.keyMetrics = keyMetrics;
  return result;
}

// ============================================================
// Agent 3 — Technical
// ============================================================

export async function runTechnicalAgent(
  symbol: string,
  companyName: string,
  quote: Quote,
  financials: BasicFinancials | null
): Promise<TechnicalAgentReport> {
  const m = financials?.metric ?? {};
  const fiftyTwoHigh = (m["52WeekHigh"] as number) ?? null;
  const fiftyTwoLow = (m["52WeekLow"] as number) ?? null;
  const sma50 = (m["50DayAverage"] as number) ?? null;
  const sma200 = (m["200DayAverage"] as number) ?? null;

  const pctFromHigh = fiftyTwoHigh
    ? (((quote.c - fiftyTwoHigh) / fiftyTwoHigh) * 100).toFixed(1)
    : "N/A";
  const pctFromLow = fiftyTwoLow
    ? (((quote.c - fiftyTwoLow) / fiftyTwoLow) * 100).toFixed(1)
    : "N/A";

  const systemPrompt = `You are a technical analyst. You evaluate price action, moving averages, and 52-week range positioning to produce a directional view. You stay disciplined — technical signals are short-term; you flag what they imply without overclaiming.`;

  const userPrompt = `Symbol: ${symbol} (${companyName})

Price snapshot:
- Current: $${quote.c.toFixed(2)}
- Day change: ${quote.d.toFixed(2)} (${quote.dp.toFixed(2)}%)
- Day range: $${quote.l.toFixed(2)} - $${quote.h.toFixed(2)}
- Previous close: $${quote.pc.toFixed(2)}

Range positioning:
- 52-week high: ${fiftyTwoHigh ? `$${fiftyTwoHigh.toFixed(2)} (${pctFromHigh}% from current)` : "N/A"}
- 52-week low: ${fiftyTwoLow ? `$${fiftyTwoLow.toFixed(2)} (${pctFromLow}% from current)` : "N/A"}
- 50-day MA: ${sma50 ? `$${sma50.toFixed(2)}` : "N/A"}
- 200-day MA: ${sma200 ? `$${sma200.toFixed(2)}` : "N/A"}

Assess the technical setup.`;

  const schemaHint = `{
  "agent": "technical",
  "signal": "bullish" | "neutral" | "bearish",
  "confidence": <0.0 to 1.0>,
  "summary": "<2-3 sentence technical view>",
  "findings": [
    { "point": "<1-sentence insight>", "evidence": "<specific price levels or MA crossovers>" }
  ],
  "priceContext": {
    "current": ${quote.c},
    "dayChange": ${quote.d},
    "dayChangePercent": ${quote.dp}
  }
}`;

  const result = await callGeminiJSON<TechnicalAgentReport>(
    systemPrompt,
    userPrompt,
    schemaHint
  );
  result.agent = "technical";
  result.priceContext = {
    current: quote.c,
    dayChange: quote.d,
    dayChangePercent: quote.dp,
  };
  return result;
}

// ============================================================
// Agent 4 — Synthesizer
// ============================================================

export async function runSynthesizerAgent(
  symbol: string,
  companyName: string,
  news: NewsAgentReport,
  fundamentals: FundamentalsAgentReport,
  technical: TechnicalAgentReport,
  recommendations: RecommendationTrend[]
): Promise<SynthesizerReport> {
  const latest = recommendations[0];
  const consensus = latest
    ? `Analysts (${latest.period}): ${latest.strongBuy} Strong Buy, ${latest.buy} Buy, ${latest.hold} Hold, ${latest.sell} Sell, ${latest.strongSell} Strong Sell`
    : "Analyst recommendations unavailable.";

  const systemPrompt = `You are a senior portfolio strategist. You receive reports from three specialist analysts (news, fundamentals, technical) and produce an integrated thesis. You weigh agreements and disagreements between them. You DO NOT give buy/sell advice — you produce an analysis. You explicitly flag what would need to change to invalidate your view.`;

  const userPrompt = `Subject: ${companyName} (${symbol})

NEWS ANALYST REPORT:
Signal: ${news.signal} (confidence ${news.confidence})
Summary: ${news.summary}
Key findings: ${news.findings.map((f) => `- ${f.point}`).join("\n")}

FUNDAMENTALS ANALYST REPORT:
Signal: ${fundamentals.signal} (confidence ${fundamentals.confidence})
Summary: ${fundamentals.summary}
Key findings: ${fundamentals.findings.map((f) => `- ${f.point}`).join("\n")}

TECHNICAL ANALYST REPORT:
Signal: ${technical.signal} (confidence ${technical.confidence})
Summary: ${technical.summary}
Key findings: ${technical.findings.map((f) => `- ${f.point}`).join("\n")}

ANALYST CONSENSUS:
${consensus}

Produce an integrated thesis. Note where the three lenses agree and where they diverge.`;

  const schemaHint = `{
  "agent": "synthesizer",
  "overallSignal": "bullish" | "neutral" | "bearish",
  "confidence": <0.0 to 1.0>,
  "thesis": "<3-4 sentence integrated view>",
  "bullishPoints": ["<bullish factor 1>", "<bullish factor 2>"],
  "bearishPoints": ["<bearish factor 1>", "<bearish factor 2>"],
  "watchPoints": ["<thing to monitor 1>", "<thing to monitor 2>"],
  "analystConsensus": "<1 sentence summary of the analyst consensus>"
}`;

  const result = await callGeminiJSON<SynthesizerReport>(
    systemPrompt,
    userPrompt,
    schemaHint
  );
  result.agent = "synthesizer";
  return result;
}