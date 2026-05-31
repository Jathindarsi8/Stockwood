"use client";

import { TradingViewWidget } from "./tradingview-widget";

type Props = {
  symbol: string;
};

export function AdvancedChartWidget({ symbol }: Props) {
  return (
    <TradingViewWidget
      scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
      height={520}
      config={{
        autosize: true,
        symbol,
        interval: "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        enable_publishing: false,
        backgroundColor: "rgba(0, 0, 0, 0)",
        gridColor: "rgba(63, 63, 70, 0.3)",
        hide_top_toolbar: false,
        hide_legend: false,
        allow_symbol_change: true,
        save_image: false,
        calendar: false,
        support_host: "https://www.tradingview.com",
      }}
    />
  );
}