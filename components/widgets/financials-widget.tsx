"use client";

import { TradingViewWidget } from "./tradingview-widget";

type Props = {
  symbol: string;
};

export function FinancialsWidget({ symbol }: Props) {
  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-financials.js"
      height={490}
      config={{
        isTransparent: true,
        largeChartUrl: "",
        displayMode: "regular",
        width: "100%",
        height: "100%",
        colorTheme: "dark",
        symbol,
        locale: "en",
      }}
    />
  );
}