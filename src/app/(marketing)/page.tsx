"use client";

import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden px-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+6rem)] text-left">
      <div className="from-primary pointer-events-none absolute inset-x-[-20%] top-[-20%] h-[360px] bg-gradient-to-b to-transparent opacity-40 blur-[120px]" />
      <LocaleSwitcher className="absolute right-6 top-6 z-10" />

      <div className="mx-auto flex w-full max-w-lg flex-col gap-[5.75rem]">
        <header className="space-y-[1.875rem]">
          <span className="text-primary text-[11px] font-semibold uppercase tracking-[0.55em]">
            {t("landing.eyebrow")}
          </span>
          <h1 className="text-[3.375rem] font-semibold tracking-[-0.03em] text-balance drop-shadow-xl">
            {t("landing.title")}
          </h1>
          <p className="text-muted-foreground text-xl leading-snug tracking-tight text-balance">
            {t("landing.subtitle")}
          </p>
        </header>

        <div className="flex flex-wrap gap-8">
          <Button
            size="lg"
            className="hover:brightness-110 h-[60px] min-w-[216px] flex-1 rounded-full px-14 text-xl font-semibold shadow-[0_24px_60px_-20px_rgb(45_212_191/1)]"
            asChild
          >
            <Link href="/login">{t("landing.start")}</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-[60px] min-w-[216px] flex-1 rounded-full border border-white/20 bg-transparent px-14 text-xl"
            asChild
          >
            <Link href="#highlights">{t("landing.tour")}</Link>
          </Button>
        </div>

        <section
          id="highlights"
          className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),transparent_72%)] p-14 shadow-xl shadow-teal-500/35"
        >
          <dl className="space-y-[2.875rem] text-lg tracking-tight text-muted-foreground">
            <div>
              <dt className="text-foreground text-xs font-semibold uppercase tracking-[0.45em]">
                {t("landing.mobileTitle")}
              </dt>
              <dd className="mt-12 leading-snug tracking-tight text-balance">
                {t("landing.mobileBody")}
              </dd>
            </div>
            <div>
              <dt className="text-foreground text-xs font-semibold uppercase tracking-[0.45em]">
                {t("landing.offlineTitle")}
              </dt>
              <dd className="mt-12 leading-snug tracking-tight text-balance">
                {t("landing.offlineBody")}
              </dd>
            </div>
          </dl>
          <footer className="text-muted-foreground/80 mt-[4.875rem] text-xs uppercase tracking-[0.62em]">
            {t("landing.stack")}
          </footer>
        </section>
      </div>
    </div>
  );
}
