import { useApp, useDispatch } from "../../context/AppContext";

export type DockSection = "upload" | "brush" | "characters" | "colors" | "layers" | "export";

interface Props {
  activeSection: DockSection;
  onSectionChange: (section: DockSection) => void;
  mobileInspectorOpen: boolean;
  onMobileInspectorToggle: () => void;
}

const dockItems: { id: DockSection; icon: string; label: string }[] = [
  { id: "upload", icon: "near_me", label: "SELECT" },
  { id: "brush", icon: "edit", label: "DRAW" },
  { id: "characters", icon: "format_size", label: "TYPE" },
  { id: "colors", icon: "palette", label: "PALETTE" },
];

const dockBottom: { id: DockSection; icon: string; label: string }[] = [
  { id: "layers", icon: "layers", label: "LAYERS" },
  { id: "export", icon: "ios_share", label: "EXPORT" },
];

export default function Dock({ activeSection, onSectionChange, mobileInspectorOpen, onMobileInspectorToggle }: Props) {
  const state = useApp();
  const dispatch = useDispatch();

  const handleClick = (id: DockSection) => {
    onSectionChange(id);
    if (id === "upload") {
      document.dispatchEvent(new CustomEvent("ascii-studio-upload"));
    }
    onMobileInspectorToggle();
  };

  const handleClear = () => {
    dispatch({ type: "CLEAR_IMAGE" });
  };

  return (
    <>
      <aside className="hidden lg:flex fixed left-4 top-24 bottom-24 w-20 rounded-lg bg-surface border border-secondary flex-col items-center py-4 gap-3 z-40">
        <div className="flex flex-col gap-2 w-full px-2">
          {dockItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-14 flex flex-col items-center justify-center rounded-sm p-2 transition-all active:scale-95 ${
                activeSection === item.id && mobileInspectorOpen
                  ? "bg-secondary text-on-secondary"
                  : "text-secondary hover:bg-secondary-container hover:text-on-secondary-container"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="font-label-caps text-[8px] mt-1 tracking-wider">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto border-t border-secondary w-full pt-3 flex flex-col items-center gap-3 px-2">
          {dockBottom.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-14 flex flex-col items-center justify-center rounded-sm p-2 transition-all active:scale-95 ${
                activeSection === item.id && mobileInspectorOpen
                  ? "bg-secondary text-on-secondary"
                  : "text-secondary hover:bg-secondary-container hover:text-on-secondary-container"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="font-label-caps text-[8px] mt-1 tracking-wider">{item.label}</span>
            </button>
          ))}
          {state.imageUrl && (
            <button
              onClick={handleClear}
              className="w-14 flex flex-col items-center justify-center rounded-sm p-2 text-secondary hover:bg-error-container/30 hover:text-error transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">delete</span>
              <span className="font-label-caps text-[8px] mt-1 tracking-wider">CLEAR</span>
            </button>
          )}
        </div>
      </aside>

      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around h-14 bg-surface border-t border-outline-variant"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {[...dockItems, ...dockBottom].map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
              activeSection === item.id && mobileInspectorOpen
                ? "text-secondary"
                : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-[9px] font-label-caps tracking-wider">{item.label}</span>
          </button>
        ))}
        {state.imageUrl && (
          <button
            onClick={handleClear}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[22px]">delete</span>
            <span className="text-[9px] font-label-caps tracking-wider">CLEAR</span>
          </button>
        )}
      </nav>
    </>
  );
}
