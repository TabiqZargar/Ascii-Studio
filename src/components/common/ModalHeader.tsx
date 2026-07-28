import type { ReactNode } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children?: ReactNode;
}

export default function ModalHeader({ title, onClose, children }: Props) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="font-headline text-lg text-primary">{title}</h2>
        {children}
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
        aria-label="Close modal"
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>
    </div>
  );
}
