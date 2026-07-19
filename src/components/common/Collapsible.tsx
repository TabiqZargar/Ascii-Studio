import { useState } from "react";

interface CollapsibleProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function Collapsible({ title, defaultOpen = false, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-zinc-800/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {title}
        <span className={`text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`}>
          v
        </span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}
