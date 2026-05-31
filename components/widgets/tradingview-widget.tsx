"use client";

import { useEffect, useRef, memo } from "react";

type Props = {
  scriptSrc: string;
  config: Record<string, unknown>;
  height?: number | string;
  className?: string;
};

function TradingViewWidgetInner({
  scriptSrc,
  config,
  height = 400,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Reset on every re-render to avoid duplicate scripts
    container.innerHTML = `<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>`;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;
    script.innerHTML = JSON.stringify(config);

    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [scriptSrc, config]);

  return (
    <div
      ref={containerRef}
      className={`tradingview-widget-container ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    />
  );
}

export const TradingViewWidget = memo(TradingViewWidgetInner);