import { useApp, useDispatch } from "../../context/AppContext";

export type DockSection = "upload" | "brush" | "characters" | "colors" | "layers" | "export";

interface Props {
  activeSection: DockSection;
  onSectionChange: (section: DockSection) => void;
}

const dockItems: { id: DockSection; icon: string; label: string }[] = [
  { id: "upload", icon: "upload_file", label: "Upload" },
  { id: "brush", icon: "brush", label: "Brush" },
  { id: "characters", icon: "font_download", label: "Characters" },
  { id: "colors", icon: "palette", label: "Colors" },
  { id: "layers", icon: "layers", label: "Layers" },
];

const dockBottom: { id: DockSection; icon: string; label: string }[] = [
  { id: "export", icon: "ios_share", label: "Export" },
];

export default function Dock({ activeSection, onSectionChange }: Props) {
  const state = useApp();
  const dispatch = useDispatch();

  const handleClick = (id: DockSection) => {
    onSectionChange(id);
    if (id === "upload") {
      document.dispatchEvent(new CustomEvent("ascii-studio-upload"));
    }
  };

  const handleClear = () => {
    dispatch({ type: "CLEAR_IMAGE" });
  };

  return (
    <aside className="fixed left-3 top-[100px] bottom-3 z-40 flex flex-col items-center py-4 rounded-xl w-16 hover:w-64 transition-all duration-500 overflow-hidden bg-surface/60 backdrop-blur-xl border border-outline-variant/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group/dock">
      <div className="mb-8 font-headline text-lg text-primary flex items-center justify-center">
        <span className="material-symbols-outlined text-4xl">terminal</span>
      </div>
      <div className="flex flex-col gap-2 w-full px-2">
        {dockItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all active:scale-95 ${
              activeSection === item.id
                ? "bg-primary-container/20 text-primary-fixed border-l-4 border-primary-fixed"
                : "text-on-surface-variant hover:text-on-surface hover:bg-primary/10"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-xs font-medium opacity-0 group-hover/dock:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </span>
          </button>
        ))}
      </div>
      <div className="my-4 border-t border-outline-variant/20 w-8 mx-2" />
      <div className="flex flex-col gap-2 w-full px-2">
        {dockBottom.map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all active:scale-95 ${
              activeSection === item.id
                ? "bg-primary-container/20 text-primary-fixed border-l-4 border-primary-fixed"
                : "text-on-surface-variant hover:text-on-surface hover:bg-primary/10"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-xs font-medium opacity-0 group-hover/dock:opacity-100 transition-opacity whitespace-nowrap">
              {item.label}
            </span>
          </button>
        ))}
      </div>
      {state.imageUrl && (
        <>
          <div className="my-4 border-t border-outline-variant/20 w-8 mx-2" />
          <div className="flex flex-col gap-2 w-full px-2">
            <button
              onClick={handleClear}
              className="w-full flex items-center gap-4 p-3 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">delete</span>
              <span className="text-xs font-medium opacity-0 group-hover/dock:opacity-100 transition-opacity whitespace-nowrap">
                Clear
              </span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
