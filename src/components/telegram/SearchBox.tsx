"use client";

import { Search, X } from "lucide-react";
import { useRef, useState } from "react";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
};

export function SearchBox({
  value,
  onChange,
  placeholder = "Поиск по базе знаний",
  debounceMs = 200,
}: SearchBoxProps) {
  const [draft, setDraft] = useState(value);
  const debounceRef = useRef<number | undefined>(undefined);

  function updateDraft(nextValue: string) {
    setDraft(nextValue);
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => onChange(nextValue), debounceMs);
  }

  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={draft}
        onChange={(event) => updateDraft(event.target.value)}
        placeholder={placeholder}
        className="h-13 w-full rounded-lg border border-border bg-white/[0.04] py-3 pl-12 pr-12 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-[var(--voltflow-cyan)] focus:ring-3 focus:ring-[var(--voltflow-cyan)]/20"
        type="search"
      />
      {draft ? (
        <button
          type="button"
          onClick={() => {
            window.clearTimeout(debounceRef.current);
            debounceRef.current = undefined;
            onChange("");
            setDraft("");
          }}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition hover:bg-white/[0.06] hover:text-foreground focus-visible:ring-3 focus-visible:ring-[var(--voltflow-cyan)]/30"
          aria-label="Очистить поиск"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </label>
  );
}
