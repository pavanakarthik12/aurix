"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, RefreshCw, LineChart, ShieldCheck, Key, Zap } from "lucide-react";
import { toast } from "sonner";
import type { ZerodhaHolding } from "@/app/api/zerodha/holdings/route";

const INITIAL_HOLDINGS: ZerodhaHolding[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", qty: 20, avgCost: 2400, cmp: 2850, type: "equity" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", qty: 50, avgCost: 1450, cmp: 1610, type: "equity" },
  { symbol: "NIFTYBEES", name: "Nippon India Nifty 50 BeES", qty: 1000, avgCost: 220, cmp: 243.40, type: "equity" },
  { symbol: "PPFAS_FLEXI", name: "Parag Parikh Flexi Cap Direct", qty: 120, avgCost: 520, cmp: 574.60, type: "mutual_fund" },
  { symbol: "INFY", name: "Infosys Limited", qty: 30, avgCost: 1510, cmp: 1625, type: "equity" },
];

export function PortfolioTracker() {
  const [holdings, setHoldings] = useState<ZerodhaHolding[]>(INITIAL_HOLDINGS);
  const [syncing, setSyncing] = useState(false);
  const [isLiveAccount, setIsLiveAccount] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const fetchHoldings = useCallback(async (key = apiKey, token = accessToken) => {
    setSyncing(true);
    try {
      const headers: Record<string, string> = {};
      if (key) headers["x-kite-apikey"] = key;
      if (token) headers["x-kite-accesstoken"] = token;

      const res = await fetch("/api/zerodha/holdings", { headers });
      if (res.ok) {
        const json = await res.json();
        setHoldings(json.data || INITIAL_HOLDINGS);
        setIsLiveAccount(json.liveAccount || false);
        if (json.liveAccount) {
          toast.success("Loaded live holdings from Zerodha API!");
        }
      }
    } catch {
      toast.error("Failed to load portfolio holdings");
    } finally {
      setSyncing(false);
    }
  }, [apiKey, accessToken]);

  useEffect(() => {
    const savedApiKey = localStorage.getItem("aurix_zerodha_apikey") || "";
    const savedToken = localStorage.getItem("aurix_zerodha_token") || "";
    const t = setTimeout(() => {
      if (savedApiKey) setApiKey(savedApiKey);
      if (savedToken) setAccessToken(savedToken);
      void fetchHoldings(savedApiKey, savedToken);
    }, 0);
    return () => clearTimeout(t);
  }, [fetchHoldings]);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("aurix_zerodha_apikey", apiKey);
    localStorage.setItem("aurix_zerodha_token", accessToken);
    setShowConfig(false);
    fetchHoldings(apiKey, accessToken);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("aurix_zerodha_apikey");
    localStorage.removeItem("aurix_zerodha_token");
    setApiKey("");
    setAccessToken("");
    setIsLiveAccount(false);
    toast.info("Disconnected Zerodha credentials. Reverted to Sandbox.");
    fetchHoldings("", "");
  };

  const totalInvested = holdings.reduce((acc, curr) => acc + curr.qty * curr.avgCost, 0);
  const currentTotalValue = holdings.reduce((acc, curr) => acc + curr.qty * curr.cmp, 0);
  const totalGains = currentTotalValue - totalInvested;
  const totalGainsPct = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Portfolio Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Value</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-foreground">₹{currentTotalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <Badge variant={totalGains >= 0 ? "success" : "destructive"} className="gap-1 text-[10px]">
                <TrendingUp className="h-3 w-3" />
                {totalGains >= 0 ? "+" : ""}{totalGainsPct.toFixed(2)}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Invested: ₹{totalInvested.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Profits / Gains</p>
            <span className={`text-2xl font-bold mt-2 block ${totalGains >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {totalGains >= 0 ? "+" : ""}₹{totalGains.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Across all linked assets</p>
          </CardContent>
        </Card>

        {/* Sync Controls & Connection Status */}
        <Card className="border-border bg-card">
          <CardContent className="pt-6 flex flex-col justify-between h-full">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Broker Status</p>
              {isLiveAccount ? (
                <div className="flex items-center justify-between border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Live Zerodha API</p>
                      <p className="text-[10px] text-muted-foreground">Connected via Kite Connect</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" disabled={syncing} onClick={() => fetchHoldings()}>
                    <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between border border-amber-500/30 bg-amber-500/10 rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Sandbox Demo</p>
                      <p className="text-[10px] text-muted-foreground">Simulated Market Feed</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" disabled={syncing} onClick={() => fetchHoldings()}>
                    <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => setShowConfig(!showConfig)}>
                <Key className="h-3.5 w-3.5" />
                {isLiveAccount ? "API Credentials" : "Connect Zerodha API"}
              </Button>
              {isLiveAccount && (
                <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zerodha API Configuration Form Modal/Card */}
      {showConfig && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Zerodha Kite API Credentials
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your Zerodha Kite Connect API key and session access token to view your real live holdings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCredentials} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="api-key" className="text-xs">Kite API Key</Label>
                  <Input
                    id="api-key"
                    placeholder="e.g. 8x9q2w1e..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="access-token" className="text-xs">Kite Access Token</Label>
                  <Input
                    id="access-token"
                    placeholder="e.g. zx7c8v9b..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowConfig(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Save & Fetch Live Portfolio
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Holdings List */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            Active Portfolio Holdings
          </CardTitle>
          <CardDescription>Visual summary of stock equity and mutual funds linked to your platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="pb-3">Holding</th>
                  <th className="pb-3 text-right">Quantity</th>
                  <th className="pb-3 text-right">Avg. Price</th>
                  <th className="pb-3 text-right">LTP / CMP</th>
                  <th className="pb-3 text-right">Current Value</th>
                  <th className="pb-3 text-right">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {holdings.map((item) => {
                  const invested = item.qty * item.avgCost;
                  const currentVal = item.qty * item.cmp;
                  const gains = currentVal - invested;
                  const gainsPct = invested > 0 ? (gains / invested) * 100 : 0;
                  const isUp = gains >= 0;

                  return (
                    <tr key={item.symbol} className="hover:bg-muted/5 transition-colors">
                      <td className="py-3.5">
                        <div className="font-semibold text-foreground">{item.symbol}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          {item.name}
                          <Badge variant="secondary" className="text-[9px] px-1 py-0 scale-90 origin-left uppercase">
                            {item.type.replace("_", " ")}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-mono font-medium">{item.qty}</td>
                      <td className="py-3.5 text-right font-mono text-muted-foreground">₹{item.avgCost.toFixed(2)}</td>
                      <td className="py-3.5 text-right font-mono text-foreground">₹{item.cmp.toFixed(2)}</td>
                      <td className="py-3.5 text-right font-mono font-semibold">₹{currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td className={`py-3.5 text-right font-mono font-bold ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
                        {isUp ? "+" : ""}₹{gains.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        <span className="text-[10px] font-normal block mt-0.5">
                          ({isUp ? "+" : ""}{gainsPct.toFixed(2)}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
