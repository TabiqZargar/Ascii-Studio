import { useRef, useCallback, useEffect } from "react";

export interface DebouncedFn<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

export function useDebounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): DebouncedFn<T> {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const debouncedFn = useCallback(
    (...args: unknown[]) => {
      cancel();
      timerRef.current = setTimeout(() => fnRef.current(...args), ms);
    },
    [ms, cancel]
  );

  const debounced = Object.assign(debouncedFn, { cancel }) as DebouncedFn<T>;

  useEffect(() => {
    return cancel;
  }, [cancel]);

  return debounced;
}
