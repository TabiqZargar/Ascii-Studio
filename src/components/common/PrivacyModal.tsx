import Modal from "./Modal";
import ModalHeader from "./ModalHeader";
import ModalBody from "./ModalBody";

interface Props {
  open: boolean;
  onClose: () => void;
}

const points = [
  "All processing happens locally in your browser whenever possible.",
  "Your media is not permanently stored.",
  "No tracking or analytics are added.",
  "Files are only used to generate ASCII output.",
];

export default function PrivacyModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} aria-label="Privacy policy">
      <ModalHeader title="Privacy" onClose={onClose} />
      <ModalBody>
        <div className="space-y-3">
          {points.map((point) => (
            <div key={point} className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[14px] text-secondary mt-0.5 shrink-0">shield</span>
              <p className="text-[13px] text-on-surface-variant leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </ModalBody>
    </Modal>
  );
}
