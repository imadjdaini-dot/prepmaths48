"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export function Accordion({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-display text-[16px] font-semibold text-ink">
                {item.q}
              </span>
              {isOpen ? (
                <Minus className="h-5 w-5 shrink-0 text-accent-2" />
              ) : (
                <Plus className="h-5 w-5 shrink-0 text-muted" />
              )}
            </button>
            {isOpen && (
              <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">
                {item.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
