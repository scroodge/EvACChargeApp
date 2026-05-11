import { MobileShell } from "@/components/layout/mobile-shell";

export default function AppSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileShell>{children}</MobileShell>;
}
