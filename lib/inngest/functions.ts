import { inngest } from "./client";
import { sendEmail } from "@/lib/nodemailer";
import {
  welcomeEmailTemplate,
  dailyDigestTemplate,
} from "@/lib/nodemailer/templates";
import {
  getCompanyNews,
  getMarketNews,
  getCompanyProfile,
  getBasicFinancials,
  getQuote,
  getRecommendationTrends,
} from "@/lib/finnhub";
import {
  runNewsAgent,
  runFundamentalsAgent,
  runTechnicalAgent,
  runSynthesizerAgent,
  type FullResearchReport,
} from "./agents";
import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/Watchlist";
import mongoose from "mongoose";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

type UserCreatedEventData = {
  email: string;
  name: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
};

type DigestUser = {
  _id: string;
  email: string;
  name: string;
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
};

// Shared Gemini caller
const callGemini = async (
  prompt: string,
  opts: { temperature?: number; maxOutputTokens?: number } = {}
) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const response = await fetch(
    `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxOutputTokens ?? 500,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no text content");

  return text.trim();
};

// ============================================================
// 1. Welcome email function (Step 3)
// ============================================================

export const sendWelcomeEmail = inngest.createFunction(
  {
    id: "send-welcome-email",
    name: "Send AI Welcome Email",
    triggers: { event: "app/user.created" },
  },
  async ({ event, step }) => {
    const data = event.data as UserCreatedEventData;
    const firstName = data.name.split(" ")[0];

    const prompt = await step.run("build-prompt", async () => {
      return `You are a friendly financial assistant welcoming a new user to Stockwood, an AI-powered stock market tracking platform.

Write a warm, personalized welcome message for ${firstName}. Their profile:
- Country: ${data.country}
- Investment goals: ${data.investmentGoals}
- Risk tolerance: ${data.riskTolerance}
- Preferred industry: ${data.preferredIndustry}

Guidelines:
- Address them by first name only
- 2 to 3 short paragraphs (5 to 7 sentences total)
- Reference their specific risk tolerance and investment goals when describing how Stockwood will personalize their experience
- Mention their preferred industry as an area Stockwood will focus alerts and insights on
- Tone: professional but warm, like a knowledgeable friend
- NO markdown, NO headers, NO bullet points, NO emojis
- Plain prose only, separated by blank lines between paragraphs
- End with one practical first action they can take (e.g. add 3 stocks to their watchlist)

Output only the message body. No subject line, no signature, no greeting boilerplate.`;
    });

    const aiContent = await step.run("call-gemini", async () => {
      return callGemini(prompt, { temperature: 0.7, maxOutputTokens: 500 });
    });

    const emailResult = await step.run("send-email", async () => {
      const html = welcomeEmailTemplate({ name: firstName, aiContent });

      const info = await sendEmail({
        to: data.email,
        subject: `Welcome to Stockwood, ${firstName}`,
        html,
      });

      return {
        to: data.email,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    });

    return { success: true, email: data.email, emailResult };
  }
);

// ============================================================
// 2. Daily News Digest Cron (fan-out dispatcher)
// ============================================================

export const dailyNewsDigestCron = inngest.createFunction(
  {
    id: "daily-news-digest-cron",
    name: "Daily News Digest — Dispatcher",
    triggers: { cron: "0 12 * * *" }, // 12:00 PM UTC daily
  },
  async ({ step }) => {
    // Step 1: Fetch opted-in users from MongoDB
    const users = await step.run("fetch-opted-in-users", async () => {
      await connectToDatabase();

      // Query the `user` collection (managed by Better Auth, not Mongoose)
      // via Mongoose's underlying connection
      const usersFromDb = await mongoose.connection
        .collection("user")
        .find({ newsOptIn: { $ne: false } }) // opted-in OR missing field (legacy users)
        .toArray();

      return usersFromDb.map((u) => ({
        _id: u._id.toString(),
        email: u.email as string,
        name: u.name as string,
        country: (u.country as string) || "US",
        investmentGoals: (u.investmentGoals as string) || "growth",
        riskTolerance: (u.riskTolerance as string) || "moderate",
        preferredIndustry: (u.preferredIndustry as string) || "technology",
      }));
    });

    if (users.length === 0) {
      return { dispatched: 0, message: "No opted-in users found" };
    }

    // Step 2: Fan out — fire one event per user
    await step.sendEvent(
      "fan-out-digests",
      users.map((user) => ({
        name: "app/news.digest.requested",
        data: { user },
      }))
    );

    return { dispatched: users.length };
  }
);

// ============================================================
// 3. Per-user digest (handles each fanned-out event)
// ============================================================

export const sendNewsDigest = inngest.createFunction(
  {
    id: "send-news-digest",
    name: "Send Personalized News Digest",
    triggers: { event: "app/news.digest.requested" },
  },
  async ({ event, step }) => {
    const user = event.data.user as DigestUser;
    const firstName = user.name.split(" ")[0];

    // Step 1: Fetch user's watchlist symbols
    const symbols = await step.run("fetch-watchlist", async () => {
      await connectToDatabase();
      const items = await Watchlist.find({ userId: user._id }).lean();
      return items.map((w) => w.symbol);
    });

    // Step 2: Fetch news — watchlist-specific or general-market fallback
    const newsResult = await step.run("fetch-news", async () => {
      if (symbols.length === 0) {
        const market = await getMarketNews(8);
        return { articles: market, isWatchlistBased: false };
      }

      // Fetch news for each watched symbol in parallel
      const newsPerSymbol = await Promise.all(
        symbols.map((s) => getCompanyNews(s, 3).catch(() => []))
      );

      const allArticles = newsPerSymbol
        .flat()
        .sort((a, b) => b.datetime - a.datetime)
        .slice(0, 8);

      // Fallback if all watchlist queries returned empty
      if (allArticles.length === 0) {
        const market = await getMarketNews(8);
        return { articles: market, isWatchlistBased: false };
      }

      return { articles: allArticles, isWatchlistBased: true };
    });

    // Skip if there's truly no content to send
    if (newsResult.articles.length === 0) {
      return {
        skipped: true,
        reason: "no articles available",
        email: user.email,
      };
    }

    // Step 3: AI summarization
    const aiSummary = await step.run("generate-ai-summary", async () => {
      const headlines = newsResult.articles
        .map(
          (a, i) =>
            `${i + 1}. ${a.headline} (${a.source})\n   ${a.summary.slice(0, 200)}`
        )
        .join("\n\n");

      const prompt = `You are a financial analyst writing a daily news digest summary for ${firstName}.

User profile:
- Country: ${user.country}
- Investment goals: ${user.investmentGoals}
- Risk tolerance: ${user.riskTolerance}
- Preferred industry: ${user.preferredIndustry}

Today's headlines (${newsResult.isWatchlistBased ? "from their watchlist" : "general market"}):
${headlines}

Write a 3 to 4 sentence executive summary that:
- Highlights the most important themes from today's news
- Relates the news to their ${user.investmentGoals} goals and ${user.riskTolerance} risk profile
- Notes any specific developments in ${user.preferredIndustry} if relevant
- Uses plain prose only, no markdown, no bullet points, no emojis
- Conversational and concise, like a knowledgeable friend giving a quick rundown

Output only the summary text. No preamble, no "Here is" intro.`;

      return callGemini(prompt, { temperature: 0.6, maxOutputTokens: 400 });
    });

    // Step 4: Send the digest email
    const emailResult = await step.run("send-digest-email", async () => {
      const html = dailyDigestTemplate({
        name: firstName,
        aiSummary,
        articles: newsResult.articles,
        isWatchlistBased: newsResult.isWatchlistBased,
      });

      const info = await sendEmail({
        to: user.email,
        subject: newsResult.isWatchlistBased
          ? `Your Watchlist Digest — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : `Market Digest — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        html,
      });

      return {
        to: user.email,
        messageId: info.messageId,
        accepted: info.accepted,
        articleCount: newsResult.articles.length,
        isWatchlistBased: newsResult.isWatchlistBased,
      };
    });

    return { success: true, email: user.email, emailResult };
  }
);

// ============================================================
// 4. Stock Research Orchestrator (Step 7)
// ============================================================

export const stockResearchOrchestrator = inngest.createFunction(
  {
    id: "stock-research-orchestrator",
    name: "Stock Research Orchestrator",
    retries: 2,
    triggers: { event: "app/stock.research.requested" },
  },
  async ({ event, step }) => {
    const { symbol, userId } = event.data as {
      symbol: string;
      userId: string;
    };

    const upperSymbol = symbol.toUpperCase();

    // ---------------- Phase 1: Fan out data fetches in parallel ----------------

    const [profile, news, financials, quote, recommendations] =
      await Promise.all([
        step.run("fetch-profile", () => getCompanyProfile(upperSymbol)),
        step.run("fetch-news", () => getCompanyNews(upperSymbol, 8)),
        step.run("fetch-financials", () => getBasicFinancials(upperSymbol)),
        step.run("fetch-quote", () => getQuote(upperSymbol)),
        step.run("fetch-recommendations", () =>
          getRecommendationTrends(upperSymbol)
        ),
      ]);

    const companyName = profile?.name ?? upperSymbol;

    // ---------------- Phase 2: Run 3 specialist agents in parallel ----------------

    const [newsReport, fundamentalsReport, technicalReport] = await Promise.all(
      [
        step.run("agent-news", () =>
          runNewsAgent(upperSymbol, companyName, news)
        ),
        step.run("agent-fundamentals", () =>
          runFundamentalsAgent(upperSymbol, companyName, profile, financials)
        ),
        step.run("agent-technical", () =>
          runTechnicalAgent(upperSymbol, companyName, quote, financials)
        ),
      ]
    );

    // ---------------- Phase 3: Synthesizer reads all 3 reports ----------------

    const synthesisReport = await step.run("agent-synthesizer", () =>
      runSynthesizerAgent(
        upperSymbol,
        companyName,
        newsReport,
        fundamentalsReport,
        technicalReport,
        recommendations
      )
    );

    // ---------------- Phase 4: Persist full report ----------------

    const fullReport: FullResearchReport = {
      symbol: upperSymbol,
      companyName,
      generatedAt: new Date().toISOString(),
      news: newsReport,
      fundamentals: fundamentalsReport,
      technical: technicalReport,
      synthesis: synthesisReport,
    };

    await step.run("persist-report", async () => {
      const mongoose = await connectToDatabase();
      const db = mongoose.connection.db;
      if (!db) throw new Error("DB connection not ready");

      await db.collection("researchReports").updateOne(
        { symbol: upperSymbol, userId },
        {
          $set: {
            ...fullReport,
            userId,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    });

    return {
      success: true,
      symbol: upperSymbol,
      companyName,
      overallSignal: synthesisReport.overallSignal,
    };
  }
);