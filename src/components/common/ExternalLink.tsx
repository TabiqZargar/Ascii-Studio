import type { ReactNode } from "react";

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
}

export default function ExternalLink({ href, children, className = "" }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 transition-colors group ${className}`}
      title="Opens in new tab"
    >
      {children}
      <span className="material-symbols-outlined text-[14px] opacity-50 group-hover:opacity-100 transition-opacity">
        open_in_new
      </span>
    </a>
  );
}
