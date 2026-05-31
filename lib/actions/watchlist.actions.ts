"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/Watchlist";

export type WatchlistItem = {
  symbol: string;
  company: string;
  addedAt: string | null;
};

async function getUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const userId = await getUserId();
  await connectToDatabase();

  const items = await Watchlist.find({ userId })
    .sort({ addedAt: -1 })
    .lean();

  return items.map((i) => ({
    symbol: i.symbol,
    company: i.company,
    addedAt: i.addedAt ? new Date(i.addedAt).toISOString() : null,
  }));
}

export async function addToWatchlist(
  symbol: string,
  company: string
): Promise<{ success: boolean; error?: string }> {
  const userId = await getUserId();
  await connectToDatabase();

  try {
    await Watchlist.create({ userId, symbol, company });
    return { success: true };
  } catch (err: unknown) {
    // Duplicate key (compound unique index on userId+symbol)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return { success: false, error: "Already in your watchlist" };
    }
    console.error("addToWatchlist failed:", err);
    return { success: false, error: "Failed to add to watchlist" };
  }
}

export async function removeFromWatchlist(
  symbol: string
): Promise<{ success: boolean }> {
  const userId = await getUserId();
  await connectToDatabase();

  await Watchlist.deleteOne({ userId, symbol });
  return { success: true };
}