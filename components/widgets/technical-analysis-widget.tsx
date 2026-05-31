"use client";

import { TradingViewWidget } from "./tradingview-widget";

type Props = {
  symbol: string;
};

export function TechnicalAnalysisWidget({ symbol }: Props) {
  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
      height={450}
      config={{
        interval: "1D",
        width: "100%",
        height: "100%",
        isTransparent: true,
        symbol,
        showIntervalTabs: true,
        displayMode: "single",
        locale: "en",
        colorTheme: "dark",
      }}
    />
  );
}