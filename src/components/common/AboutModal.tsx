import Modal from "./Modal";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";
import ExternalLink from "./ExternalLink";

interface Props {
  open: boolean;
  onClose: () => void;
}

const features = [
  "Image to ASCII",
  "Animated GIF to ASCII",
  "Live Preview",
  "Adjustable character density",
  "Multiple color modes",
  "Export as TXT, PNG, SVG, HTML",
  "Fast client-side processing",
];

const techStack = ["React", "TypeScript", "Vite", "HTML5 Canvas", "Web Workers"];

export default function AboutModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} aria-label="About ASCII Studio">
      <ModalHeader title="About" onClose={onClose} />
      <ModalBody>
        <div className="space-y-5">
          <div>
            <h3 className="font-headline text-xl text-on-surface mb-1">ASCII Studio</h3>
            <p className="text-[13px] text-on-surface-variant leading-relaxed">
              A modern browser-based ASCII art generator built with React.
            </p>
          </div>

          <div className="border-t border-outline-variant/50 pt-4">
            <h3 className="font-label-caps text-[10px] text-tertiary tracking-wider mb-2">Features</h3>
            <ul className="space-y-1.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[13px] text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px] text-secondary">check</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-outline-variant/50 pt-4">
            <h3 className="font-label-caps text-[10px] text-tertiary tracking-wider mb-2">Built with</h3>
            <div className="flex flex-wrap gap-2">
              {techStack.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-sm bg-surface-container-high border border-outline-variant text-[11px] font-label-caps text-on-surface-variant tracking-wider">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t border-outline-variant/50 pt-4">
            <p className="text-[13px] text-on-surface-variant mb-2">
              Made by <span className="text-primary font-medium">Tabiq Zargar</span>
            </p>
            <ExternalLink
              href="https://github.com/TabiqZargar/Ascii-Studio"
              className="text-[13px] text-secondary hover:text-primary"
            >
              View on GitHub
            </ExternalLink>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
