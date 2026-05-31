"use client";

import { TradingViewWidget } from "./tradingview-widget";

type Props = {
  symbol: string;
};

export function SymbolInfoWidget({ symbol }: Props) {
  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js"
      height={170}
      config={{
        symbol,
        colorTheme: "dark",
        isTransparent: true,
        locale: "en",
        width: "100%",
      }}
    />
  );
}