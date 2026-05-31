# Stockwood

> AI-powered stock market intelligence platform with a multi-agent research system

Stockwood is a personalized stock market dashboard that uses a fleet of specialized AI agents to produce structured equity research. Built with Next.js 16, MongoDB, Inngest, and Google Gemini.

---

## Features

- **Multi-Agent AI Research** — Four specialized Gemini agents (News, Fundamentals, Technical, Synthesizer) run in parallel to produce structured stock analysis with bullish/neutral/bearish signals, confidence scores, and citations
- **Personalized AI Welcome Emails** — On signup, an Inngest-orchestrated pipeline generates a custom welcome email based on the user's risk tolerance, investment goals, and preferred industry
- **Daily News Digest** — Cron-based fan-out system sends each user a personalized daily digest of news for their watchlist, with AI-generated executive summary
- **Real-Time Dashboard** — Market Overview, Top Stories, Sector Heatmap, and Quote Tickers powered by TradingView
- **Per-Stock Detail Pages** — Live price charts, technical analysis, financials, and on-demand AI research for any stock symbol
- **Watchlist** — Add/remove stocks with a debounced symbol search powered by Finnhub
- **Auth** — Email/password authentication with custom user profile fields (Better Auth + MongoDB adapter)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix primitives) |
| Database | MongoDB Atlas + Mongoose |
| Authentication | Better Auth (email/password with custom fields) |
| AI | Google Gemini 2.5 Flash Lite |
| Background Jobs | Inngest (cron + event-driven workflows) |
| Email | Nodemailer + Gmail SMTP |
| Market Data | Finnhub API (real-time quotes, fundamentals, news) |
| Charts | TradingView Embedded Widgets |

---

## The Multi-Agent Research System

This is the architectural centerpiece of Stockwood.

When a user requests AI research for a stock, the orchestrator runs a four-phase pipeline using Inngest:

### Phase 1 — Parallel data fetching (5 concurrent API calls)
- Company profile (industry, market cap)
- Recent news (last 2 days, top 8 articles)
- Basic financials (P/E, ROE, margins, debt ratios)
- Live quote (price, day range, 52-week high/low)
- Analyst recommendation trends

### Phase 2 — Three specialist agents in parallel
- **News Analyst** — Reads headlines, extracts sentiment, surfaces findings with article citations
- **Fundamentals Analyst** — Evaluates ratios and margins, produces health assessment with metric evidence
- **Technical Analyst** — Analyzes price action, moving averages, and 52-week range positioning

Each agent returns structured JSON: `signal: bullish|neutral|bearish`, `confidence: 0-1`, `summary`, `findings[]` with evidence.

### Phase 3 — Synthesizer
Receives all three reports plus analyst consensus, produces an integrated thesis with bullish points, bearish points, and watch points. Explicitly notes where the three lenses agree and disagree.

### Phase 4 — Atomic persistence
Full report is upserted to MongoDB only after all four agents succeed. Partial failures retry automatically via Inngest step semantics; no half-complete reports are ever shown.

### Why this is interesting engineering

- **Independent retries** — If the Fundamentals agent rate-limits, only that step retries
- **Structured output enforcement** — `responseMimeType: "application/json"` + schema hints in the prompt + JSON parse with markdown fence stripping
- **Deterministic data injection** — After each agent returns, the numeric fields (`priceContext`, `keyMetrics`, `articleCount`) are overwritten with the deterministic values fetched in Phase 1. The model reasons; the system supplies the facts.
- **Graceful degradation** — Agents return low-confidence "neutral" reports when their data source is empty rather than failing
- **Total runtime** — ~5-15 seconds for a fresh analysis across 9 orchestrated steps

---

## Architecture Highlights

- **Fan-out cron pattern** — Daily digest cron queries opted-in users, then fires one event per user. Each user's digest runs as an independent function with its own retry budget.
- **Database hooks for event firing** — Better Auth's `databaseHooks.user.create.after` triggers the welcome email event, decoupled from the signup transaction.
- **MongoDB connection caching** — Global cache pattern survives serverless cold starts.
- **Type-safe agent outputs** — TypeScript types are shared between agent definitions, the orchestrator, the server actions, and the React components.

---

## Running Locally

### Prerequisites
- Node.js 20+
- A MongoDB Atlas cluster (free tier is fine)
- API keys for: Google Gemini, Finnhub
- A Gmail account with an App Password (for sending email)

### Setup

```bash
git clone https://github.com/Jathindarsi8/stockwood.git
cd stockwood
npm install
```

Create a `.env.local` file in the project root with these variables:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/stockwood
NODE_ENV=development

BETTER_AUTH_SECRET=<generate-a-random-32-byte-secret>
BETTER_AUTH_URL=http://localhost:3000

GEMINI_API_KEY=<from-aistudio.google.com>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail-address>
SMTP_PASS=<your-gmail-app-password>
EMAIL_FROM=Stockwood <your-gmail-address>

FINNHUB_API_KEY=<from-finnhub.io>

INNGEST_DEV=1
```

### Run

In one terminal:
```bash
npm run dev
```

In a second terminal (for the Inngest dev server):
```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

Open `http://localhost:3000` in your browser.

---

## Project Structure

```
stockwood/
├── app/
│   ├── (auth)/              Sign in, sign up
│   ├── (root)/              Protected app routes
│   │   ├── page.tsx         Main dashboard
│   │   ├── stocks/[symbol]/ Per-stock detail with AI analysis
│   │   └── watchlist/       Watchlist management
│   └── api/
│       ├── auth/[...all]/   Better Auth handler
│       └── inngest/         Inngest function registration
├── components/
│   ├── widgets/             TradingView widget wrappers
│   └── ui/                  shadcn/ui primitives
├── database/
│   ├── models/              Mongoose schemas
│   └── mongoose.ts          Cached connection
├── lib/
│   ├── actions/             Server actions
│   ├── better-auth/         Auth config
│   ├── inngest/             Functions and agents
│   ├── finnhub/             Market data client
│   └── nodemailer/          Email transport and templates
└── types/                   Shared TypeScript types
```

---

## Disclaimer

Stockwood produces AI-generated market analysis. This is **not financial advice**. The AI agents produce structured opinions based on publicly available data; users are responsible for their own investment decisions. The author and contributors are not liable for any financial outcomes resulting from use of this software.

---

## License

MIT

---

## Author

Built by [Jathin Darsi](https://github.com/Jathindarsi8) — Senior Data Scientist and AI/ML Engineer.