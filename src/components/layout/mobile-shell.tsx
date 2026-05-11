import { BottomNav } from "@/components/layout/bottom-nav";

export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background pb-[calc(env(safe-area-inset-bottom)+5.5rem)]">
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
    </div>
  );
}
