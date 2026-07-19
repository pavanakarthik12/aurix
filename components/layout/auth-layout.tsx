import * as React from "react";
import { Logo } from "@/components/shared/logo";
import { ShieldCheck, TrendingUp, Sparkles } from "lucide-react";

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: "Bank-grade privacy for every financial record" },
  { icon: TrendingUp, text: "Insights grounded in proven financial principles" },
  { icon: Sparkles, text: "A financial persona tailored to how you actually spend" },
];

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-primary px-10 py-10 text-primary-foreground lg:px-16 lg:py-14">
        <Logo href="/" className="text-primary-foreground [&_span:last-child]:text-primary-foreground" />

        <div className="max-w-md space-y-8">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            The financial operating system built for clarity.
          </h2>
          <ul className="space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-primary-foreground/85">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Aurix Technologies. All rights reserved.
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <div className="mb-8 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
