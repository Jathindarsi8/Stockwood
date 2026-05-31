"use client";

import { TradingViewWidget } from "./tradingview-widget";

export function TopStoriesWidget() {
  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-timeline.js"
      height={450}
      config={{
        feedMode: "all_symbols",
        isTransparent: true,
        displayMode: "regular",
        width: "100%",
        height: "100%",
        colorTheme: "dark",
        locale: "en",
      }}
    />
  );
}