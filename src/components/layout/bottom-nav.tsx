"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, LayoutGrid, Settings, Zap } from "lucide-react";

import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "nav.home", icon: LayoutGrid },
  { href: "/charging", label: "nav.charge", icon: Zap },
  { href: "/history", label: "nav.history", icon: Clock },
  { href: "/settings", label: "nav.settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/95 px-4 pt-3 backdrop-blur-md"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
      aria-label={t("nav.aria") as string}
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href === "/charging" && pathname.startsWith("/charging/")) ||
            (href !== "/charging" && pathname.startsWith(href + "/"));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center rounded-xl pb-1 pt-1 text-[11px] font-medium tracking-wide transition-colors",
                "min-h-[44px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="mb-0.5 size-6 shrink-0" aria-hidden />
              {t(label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
