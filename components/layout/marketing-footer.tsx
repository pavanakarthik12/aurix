import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "AI Advisor", href: "#features" },
      { label: "Expense Tracking", href: "#features" },
      { label: "Financial Goals", href: "#features" },
      { label: "Reports", href: "#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Intelligent finance, simplified. A premium financial operating
              system built for clarity and trust.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="space-y-3">
              <p className="text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Aurix Technologies. All rights reserved.</p>
          <p>Financial guidance is educational and not a substitute for licensed advice.</p>
        </div>
      </div>
    </footer>
  );
}
