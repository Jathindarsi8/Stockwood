"use client";

import { TradingViewWidget } from "./tradingview-widget";

export function MarketQuotesWidget() {
  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js"
      height={500}
      config={{
        width: "100%",
        height: "100%",
        symbolsGroups: [
          {
            name: "Indices",
            originalName: "Indices",
            symbols: [
              { name: "FOREXCOM:SPXUSD", displayName: "S&P 500" },
              { name: "FOREXCOM:NSXUSD", displayName: "Nasdaq 100" },
              { name: "FOREXCOM:DJI", displayName: "Dow 30" },
              { name: "INDEX:NKY", displayName: "Nikkei 225" },
              { name: "INDEX:DEU40", displayName: "DAX" },
            ],
          },
          {
            name: "Tech",
            originalName: "Tech",
            symbols: [
              { name: "NASDAQ:AAPL", displayName: "Apple" },
              { name: "NASDAQ:MSFT", displayName: "Microsoft" },
              { name: "NASDAQ:NVDA", displayName: "NVIDIA" },
              { name: "NASDAQ:GOOGL", displayName: "Google" },
              { name: "NASDAQ:META", displayName: "Meta" },
            ],
          },
          {
            name: "Crypto",
            originalName: "Crypto",
            symbols: [
              { name: "BINANCE:BTCUSDT", displayName: "Bitcoin" },
              { name: "BINANCE:ETHUSDT", displayName: "Ethereum" },
              { name: "BINANCE:SOLUSDT", displayName: "Solana" },
            ],
          },
        ],
        showSymbolLogo: true,
        isTransparent: true,
        colorTheme: "dark",
        locale: "en",
      }}
    />
  );
}