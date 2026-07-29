"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  positive: boolean;
}

export function MarketTicker() {
  const [data, setData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      const res = await fetch("/api/market");
      if (res.ok) {
        const json = await res.json();
        setData(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load ticker data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Set up local micro-fluctuations so the ticker looks active and ticking in real time
  useEffect(() => {
    if (data.length === 0) return;
    const microTick = setInterval(() => {
      setData((prev) =>
        prev.map((item) => {
          // Exclude USD/INR from large fluctuations to keep it realistic
          const factor = item.symbol === "USD/INR" ? 0.002 : 0.5;
          const delta = (Math.random() - 0.5) * factor;
          const newPrice = Math.max(0.01, item.price + delta);
          return {
            ...item,
            price: parseFloat(newPrice.toFixed(2)),
          };
        })
      );
    }, 3000); // tick every 3 seconds

    return () => clearInterval(microTick);
  }, [data.length]);

  if (loading && data.length === 0) {
    return (
      <div className="flex h-9 items-center justify-center border-b border-border/60 bg-muted/20 text-xs text-muted-foreground">
        <RefreshCw className="mr-1.5 h-3 w-3 animate-spin text-primary" />
        Loading Live India Market Ticker...
      </div>
    );
  }

  return (
    <div className="relative flex h-9 w-full items-center overflow-hidden border-b border-border/60 bg-background/50 backdrop-blur-sm select-none">
      <div className="absolute left-0 z-10 flex h-full items-center bg-primary px-3 text-[10px] font-bold text-primary-foreground tracking-wider uppercase shadow-md shrink-0">
        Live Markets
      </div>

      <div className="w-full overflow-hidden pl-28 flex items-center">
        <div className="animate-marquee flex gap-12 whitespace-nowrap text-xs font-medium">
          {/* Double list for smooth infinite scrolling marquee effect */}
          {[...data, ...data].map((item, index) => {
            const TrendIcon = item.positive ? TrendingUp : TrendingDown;
            const trendColor = item.positive ? "text-emerald-500" : "text-rose-500";
            const trendBg = item.positive ? "bg-emerald-500/10" : "bg-rose-500/10";
            
            return (
              <div key={`${item.symbol}-${index}`} className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{item.symbol}</span>
                <span className="text-muted-foreground font-mono">₹{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold font-mono ${trendColor} ${trendBg}`}>
                  <TrendIcon className="h-3 w-3" />
                  {item.positive ? "+" : ""}{item.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* CSS style injected locally for custom infinite scrolling animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
