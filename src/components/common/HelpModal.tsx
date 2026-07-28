import Modal from "./Modal";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";

interface Props {
  open: boolean;
  onClose: () => void;
}

const steps = [
  { icon: "upload_file", title: "Upload", desc: "Drag & drop or browse for a supported file." },
  { icon: "tune", title: "Adjust", desc: "Tune settings until the preview looks right." },
  { icon: "visibility", title: "Preview", desc: "Watch the ASCII output update live." },
  { icon: "download", title: "Export", desc: "Download or copy the generated ASCII output." },
];

const tips = [
  "Higher resolution = more detail.",
  "Larger character sets improve gradients.",
  "Smaller outputs render faster.",
];

const formats = ["JPG", "JPEG", "PNG", "WebP", "GIF"];

export default function HelpModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} aria-label="How to use ASCII Studio">
      <ModalHeader title="How to use ASCII Studio" onClose={onClose} />
      <ModalBody>
        <div className="space-y-5">
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-base text-primary">{step.icon}</span>
                </div>
                <div>
                  <p className="font-label-caps text-[11px] text-on-surface tracking-wider font-medium">
                    <span className="text-tertiary mr-1">{String(i + 1).padStart(2, "0")}.</span>
                    {step.title}
                  </p>
                  <p className="text-[13px] text-on-surface-variant leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant/50 pt-4">
            <h3 className="font-label-caps text-[10px] text-tertiary tracking-wider mb-2">Tips</h3>
            <ul className="space-y-1.5">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-[13px] text-on-surface-variant">
                  <span className="text-secondary mt-0.5">-</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-outline-variant/50 pt-4">
            <h3 className="font-label-caps text-[10px] text-tertiary tracking-wider mb-2">Supported formats</h3>
            <div className="flex flex-wrap gap-2">
              {formats.map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-sm bg-surface-container-high border border-outline-variant text-[11px] font-label-caps text-on-surface-variant tracking-wider">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
