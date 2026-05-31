import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWatchlist extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index — a user can't add the same symbol twice
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

export const Watchlist: Model<IWatchlist> =
  mongoose.models.Watchlist ||
  mongoose.model<IWatchlist>("Watchlist", WatchlistSchema);