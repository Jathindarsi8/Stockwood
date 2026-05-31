"use client";

import { TradingViewWidget } from "./tradingview-widget";

export function ForexQuotesWidget() {
  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-forex-cross-rates.js"
      height={400}
      config={{
        width: "100%",
        height: "100%",
        currencies: ["EUR", "USD", "JPY", "GBP", "CHF", "AUD", "CAD", "INR"],
        isTransparent: true,
        colorTheme: "dark",
        locale: "en",
      }}
    />
  );
}