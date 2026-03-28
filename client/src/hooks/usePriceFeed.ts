import { useState, useEffect, useRef } from "react";

export interface TickerData {
  symbol: string;       // e.g. "BTCUSDT"
  price: number;
  open24h: number;
  high24h: number;
  low24h: number;
  volumeUSD24h: number; // quote (USDT) volume
  changePct24h: number;
}

export type PriceFeedMap = Record<string, TickerData>;

// All symbols needed by Ticker bar + Perps markets
const SYMBOLS = [
  "btcusdt", "ethusdt", "bnbusdt", "solusdt", "arbusdt",
  "maticusdt", "linkusdt", "uniusdt", "aaveusdt", "crvusdt",
];

const WS_URL =
  `wss://stream.binance.com:9443/stream?streams=${SYMBOLS.map(s => `${s}@miniTicker`).join("/")}`;

export function usePriceFeed(): PriceFeedMap {
  const [feed, setFeed] = useState<PriceFeedMap>({});
  const wsRef    = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    function connect() {
      if (!active) return;
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as { data?: {
            s: string; c: string; o: string; h: string; l: string; q: string;
          } };
          const d = msg.data;
          if (!d?.s) return;
          const price = parseFloat(d.c);
          const open  = parseFloat(d.o);
          setFeed(prev => ({
            ...prev,
            [d.s]: {
              symbol: d.s,
              price,
              open24h:      open,
              high24h:      parseFloat(d.h),
              low24h:       parseFloat(d.l),
              volumeUSD24h: parseFloat(d.q),
              changePct24h: open > 0 ? ((price - open) / open) * 100 : 0,
            },
          }));
        } catch { /* ignore parse errors */ }
      };

      ws.onerror = () => ws.close();
      ws.onclose = () => {
        if (!active) return;
        timerRef.current = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => {
      active = false;
      wsRef.current?.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return feed;
}
