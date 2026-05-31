"use client";

import { TradingViewWidget } from "./tradingview-widget";

export function MarketOverviewWidget() {
  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js"
      height={450}
      config={{
        colorTheme: "dark",
        dateRange: "12M",
        showChart: true,
        locale: "en",
        largeChartUrl: "",
        isTransparent: true,
        showSymbolLogo: true,
        showFloatingTooltip: false,
        width: "100%",
        height: "100%",
        plotLineColorGrowing: "rgba(16, 185, 129, 1)",
        plotLineColorFalling: "rgba(239, 68, 68, 1)",
        gridLineColor: "rgba(63, 63, 70, 0.1)",
        scaleFontColor: "rgba(161, 161, 170, 1)",
        belowLineFillColorGrowing: "rgba(16, 185, 129, 0.12)",
        belowLineFillColorFalling: "rgba(239, 68, 68, 0.12)",
        belowLineFillColorGrowingBottom: "rgba(16, 185, 129, 0)",
        belowLineFillColorFallingBottom: "rgba(239, 68, 68, 0)",
        symbolActiveColor: "rgba(16, 185, 129, 0.12)",
        tabs: [
          {
            title: "Indices",
            symbols: [
              { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
              { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
              { s: "FOREXCOM:DJI", d: "Dow Jones" },
              { s: "INDEX:NKY", d: "Nikkei 225" },
            ],
          },
          {
            title: "Stocks",
            symbols: [
              { s: "NASDAQ:AAPL", d: "Apple" },
              { s: "NASDAQ:MSFT", d: "Microsoft" },
              { s: "NASDAQ:NVDA", d: "NVIDIA" },
              { s: "NASDAQ:TSLA", d: "Tesla" },
              { s: "NASDAQ:GOOGL", d: "Google" },
            ],
          },
          {
            title: "Crypto",
            symbols: [
              { s: "BINANCE:BTCUSDT", d: "Bitcoin" },
              { s: "BINANCE:ETHUSDT", d: "Ethereum" },
              { s: "BINANCE:SOLUSDT", d: "Solana" },
            ],
          },
        ],
      }}
    />
  );
}