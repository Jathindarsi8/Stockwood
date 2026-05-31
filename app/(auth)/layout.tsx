import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-zinc-950 text-zinc-100">
      {/* Left panel — branding */}
      <section className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-zinc-900 to-zinc-950 border-r border-zinc-800">
        <Link href="/" className="text-2xl font-bold tracking-tight">
          Stockwood
        </Link>

        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Track the market with AI-powered insights.
          </h2>
          <p className="text-zinc-400 leading-relaxed">
            Personalized daily digests, real-time alerts, and analysis tailored
            to your investment goals — delivered straight to your inbox.
          </p>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/30 border border-emerald-500" />
              <div className="h-8 w-8 rounded-full bg-blue-500/30 border border-blue-500" />
              <div className="h-8 w-8 rounded-full bg-purple-500/30 border border-purple-500" />
            </div>
            <p className="text-sm text-zinc-500">
              Join thousands tracking smarter.
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} Stockwood. All rights reserved.
        </p>
      </section>

      {/* Right panel — form slot */}
      <section className="flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
