import { getWatchlist } from "@/lib/actions/watchlist.actions";
import { WatchlistView } from "@/components/watchlist-view";

export default async function WatchlistPage() {
  const watchlist = await getWatchlist();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Watchlist</h1>
        <p className="mt-1 text-zinc-400">
          Track stocks. Get AI-curated news digests for your picks daily.
        </p>
      </div>
      <WatchlistView initialItems={watchlist} />
    </div>
  );
}