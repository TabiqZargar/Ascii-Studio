import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function ModalBody({ children, className = "" }: Props) {
  return (
    <div className={`px-5 py-4 overflow-y-auto flex-1 min-h-0 ${className}`}>
      {children}
    </div>
  );
}
