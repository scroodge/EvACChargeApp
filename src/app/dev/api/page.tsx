import { notFound } from "next/navigation";

import { WbApiDebugger } from "@/components/dev/wb-api-debugger";

export const dynamic = "force-dynamic";

export default function DevApiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="safe-bottom mx-auto flex max-w-5xl flex-col gap-5 px-4 pb-8 pt-5">
      <header>
        <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
          Dev / WB API
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-normal">
          Wildberries product search
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Search goods through the local backend, check whether products already exist,
          and save selected products into the internal database. Requests go to{" "}
          <span className="font-mono text-foreground">
            {process.env.NEXT_PUBLIC_API_URL}
          </span>
          .
        </p>
      </header>

      <WbApiDebugger />
    </main>
  );
}
