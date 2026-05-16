import Link from "next/link";

const navItems = [
  { href: "/admin/knowledge", label: "Обзор" },
  { href: "/admin/knowledge/articles", label: "Статьи" },
  { href: "/admin/knowledge/faq", label: "Вопросы" },
  { href: "/admin/knowledge/accessories", label: "Аксессуары" },
  { href: "/admin/knowledge/categories", label: "Разделы" },
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Админка базы знаний">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="inline-flex min-h-9 items-center rounded-lg border border-border bg-white/[0.04] px-3 text-sm font-semibold text-muted-foreground transition hover:border-[var(--voltflow-cyan)]/60 hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
