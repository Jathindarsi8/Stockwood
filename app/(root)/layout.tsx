import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/better-auth/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="inline-block h-7 w-7 rounded-md bg-linear-to-br from-emerald-500 to-emerald-700 text-center text-sm font-bold leading-7 text-white">
              S
            </span>
            <span className="text-lg font-bold tracking-tight">Stockwood</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/watchlist"
              className="text-sm text-zinc-400 hover:text-zinc-100"
            >
              Watchlist
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}