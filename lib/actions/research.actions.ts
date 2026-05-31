"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { connectToDatabase } from "@/database/mongoose";
import type { FullResearchReport } from "@/lib/inngest/agents";

type Signal = "bullish" | "neutral" | "bearish";
type WatchlistSignal = { signal: Signal; confidence: number };
type WatchlistSignalMap = Record<string, WatchlistSignal>;

export async function getResearchReport(symbol: string): Promise<FullResearchReport | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return null;

  const doc = await db.collection("researchReports").findOne({
    symbol: symbol.toUpperCase(),
    userId: session.user.id,
  });

  if (!doc) return null;

  return {
    symbol: doc.symbol,
    companyName: doc.companyName,
    generatedAt: doc.generatedAt,
    news: doc.news,
    fundamentals: doc.fundamentals,
    technical: doc.technical,
    synthesis: doc.synthesis,
  } as FullResearchReport;
}

export async function requestResearchAnalysis(symbol: string): Promise<{ success: boolean; message: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { success: false, message: "Not authenticated" };
  }

  await inngest.send({
    name: "app/stock.research.requested",
    data: {
      symbol: symbol.toUpperCase(),
      userId: session.user.id,
    },
  });

  return {
    success: true,
    message: `Analysis started for ${symbol.toUpperCase()}. Check back in 30-60 seconds.`,
  };
}

export async function getLatestResearchReport(): Promise<FullResearchReport | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return null;

  const doc = await db
    .collection("researchReports")
    .find({ userId: session.user.id })
    .sort({ updatedAt: -1 })
    .limit(1)
    .next();

  if (!doc) return null;

  return {
    symbol: doc.symbol,
    companyName: doc.companyName,
    generatedAt: doc.generatedAt,
    news: doc.news,
    fundamentals: doc.fundamentals,
    technical: doc.technical,
    synthesis: doc.synthesis,
  } as FullResearchReport;
}

export async function getWatchlistSignals(): Promise<WatchlistSignalMap> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return {};

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) return {};

  const docs = await db
    .collection("researchReports")
    .find({ userId: session.user.id })
    .project({ symbol: 1, "synthesis.overallSignal": 1, "synthesis.confidence": 1 })
    .toArray();

  const result: WatchlistSignalMap = {};
  for (const doc of docs) {
    if (doc.symbol && doc.synthesis?.overallSignal) {
      result[doc.symbol] = {
        signal: doc.synthesis.overallSignal,
        confidence: doc.synthesis.confidence,
      };
    }
  }
  return result;
}