import { useApp, useDispatch } from "../../context/AppContext";

export type DockSection = "upload" | "brush" | "characters" | "colors" | "layers" | "export";

interface Props {
  activeSection: DockSection;
  onSectionChange: (section: DockSection) => void;
  mobileInspectorOpen: boolean;
  onMobileInspectorToggle: () => void;
}

const dockItems: { id: DockSection; icon: string; label: string }[] = [
  { id: "upload", icon: "upload_file", label: "Upload" },
  { id: "brush", icon: "brush", label: "Brush" },
  { id: "characters", icon: "font_download", label: "Chars" },
  { id: "colors", icon: "palette", label: "Colors" },
  { id: "layers", icon: "layers", label: "Layers" },
];

const dockBottom: { id: DockSection; icon: string; label: string }[] = [
  { id: "export", icon: "ios_share", label: "Export" },
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
      {/* Desktop: Side panel */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-16 z-40 flex-col items-center py-4 rounded-xl my-12 ml-12 w-20 hover:w-64 transition-all duration-500 overflow-hidden bg-surface-container/60 backdrop-blur-xl border border-primary/15 shadow-2xl group animate-float stagger-2">
        <div className="mb-8 text-primary font-bold flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl">terminal</span>
        </div>
        <div className="flex flex-col gap-3 w-full px-3">
          {dockItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all active:scale-95 ${
                activeSection === item.id
                  ? "bg-primary text-on-primary shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "text-on-surface-variant hover:bg-primary/20 hover:text-primary neon-glow"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <div className="my-4 border-t border-primary/20 w-8 mx-2" />
        <div className="flex flex-col gap-3 w-full px-3">
          {dockBottom.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all active:scale-95 ${
                activeSection === item.id
                  ? "bg-primary text-on-primary shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                  : "text-on-surface-variant hover:bg-primary/20 hover:text-primary neon-glow"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
        {state.imageUrl && (
          <>
            <div className="my-4 border-t border-primary/20 w-8 mx-2" />
            <div className="flex flex-col gap-3 w-full px-3">
              <button
                onClick={handleClear}
                className="w-full flex items-center gap-4 p-3 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all active:scale-95 neon-glow"
              >
                <span className="material-symbols-outlined">delete</span>
                <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Clear
                </span>
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Mobile: Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around h-14 bg-surface-container/80 backdrop-blur-xl border-t border-primary/15 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {dockItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
              activeSection === item.id && mobileInspectorOpen
                ? "text-primary"
                : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        ))}
        {dockBottom.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg transition-all ${
              activeSection === item.id && mobileInspectorOpen
                ? "text-primary"
                : "text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="text-[9px] font-medium">{item.label}</span>
          </button>
        ))}
        {state.imageUrl && (
          <button
            onClick={handleClear}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-lg text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[22px]">delete</span>
            <span className="text-[9px] font-medium">Clear</span>
          </button>
        )}
      </nav>
    </>
  );
}
