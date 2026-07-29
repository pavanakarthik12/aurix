"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, RefreshCw, Globe, Clock } from "lucide-react";
import { toast } from "sonner";
import type { FinancialNewsItem } from "@/app/api/news/route";

export function FinancialNewsFeed() {
  const [news, setNews] = useState<FinancialNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLiveScraped, setIsLiveScraped] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        setNews(data.news || []);
        setIsLiveScraped(data.liveScraped || false);
      }
    } catch {
      toast.error("Failed to load news feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const categories = ["All", "Tax Planning", "Mutual Funds & SIP", "Stock Market", "Personal Finance"];

  const filteredNews = selectedCategory === "All" 
    ? news 
    : news.filter((item) => item.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            Financial Advice & Market News Feed
          </h2>
          <p className="text-sm text-muted-foreground">
            Scraped in real-time from trusted Indian financial advice platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isLiveScraped ? "success" : "secondary"} className="gap-1 text-[11px]">
            <Globe className="h-3 w-3" />
            {isLiveScraped ? "Live Scraped Feed" : "Curated Advice Feed"}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchNews} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="text-xs rounded-full"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* News Feed Grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-36" />
            </Card>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No articles found for this category.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredNews.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between border-border bg-card hover:border-primary/40 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                    {item.category}
                  </Badge>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.publishedAt}
                  </span>
                </div>
                <CardTitle className="text-sm font-semibold leading-snug line-clamp-2">
                  {item.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-3 mt-1.5 leading-relaxed">
                  {item.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex items-center justify-between border-t border-border/50 mt-2">
                <span className="text-[11px] font-medium text-muted-foreground">{item.source}</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:text-primary" asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    Read Article
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
