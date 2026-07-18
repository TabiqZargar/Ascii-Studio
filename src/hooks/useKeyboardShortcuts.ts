import { useEffect, useRef } from "react";
import { useDispatch } from "../context/AppContext";

export function useKeyboardShortcuts() {
  const dispatch = useDispatch();
  const panning = useRef(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "UNDO" });
      }
      if (ctrl && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }
      if (ctrl && e.key === "y") {
        e.preventDefault();
        dispatch({ type: "REDO" });
      }
      if (ctrl && e.key === "s") {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent("glyphlab-save"));
      }
      if (e.key === " " && !ctrl && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        panning.current = !panning.current;
        document.body.style.cursor = panning.current ? "grab" : "";
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
        dispatch({ type: "SET_BRUSH_TYPE", brush: "eraser" });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dispatch]);
}
