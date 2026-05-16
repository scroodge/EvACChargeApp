import { Search } from "lucide-react";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBox({
  value,
  onChange,
  placeholder = "Search knowledge base",
}: SearchBoxProps) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-13 w-full rounded-lg border border-border bg-white/[0.04] py-3 pl-12 pr-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--voltflow-cyan)] focus:ring-3 focus:ring-[var(--voltflow-cyan)]/20"
        type="search"
      />
    </label>
  );
}
