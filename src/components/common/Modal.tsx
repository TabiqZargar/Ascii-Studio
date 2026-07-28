import { useEffect, useRef, useCallback, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  "aria-label"?: string;
}

export default function Modal({ open, onClose, children, "aria-label": ariaLabel }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const getFocusable = useCallback(() => {
    if (!panelRef.current) return [];
    return Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
  }, []);

  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => {
        const focusable = getFocusable();
        if (focusable.length > 0) focusable[0].focus();
        else panelRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      previousFocus.current?.focus();
    }
  }, [open, getFocusable]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab") {
        const focusable = getFocusable();
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [open, onClose, getFocusable]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg max-h-[85vh] bg-surface border border-outline-variant rounded-lg shadow-2xl overflow-hidden flex flex-col animate-scaleIn focus:outline-none"
      >
        {children}
      </div>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scaleIn { animation: none; }
          .animate-fadeIn { animation: none; }
        }
      `}</style>
    </div>
  );
}
