import { useState } from "react";
import ExternalLink from "./ExternalLink";
import HelpModal from "./HelpModal";
import AboutModal from "./AboutModal";
import PrivacyModal from "./PrivacyModal";

export default function Footer() {
  const [helpOpen, setHelpOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-outline-variant">
        <div className="flex items-center justify-between px-4 py-2 max-w-screen-2xl mx-auto">
          <div className="font-label-caps text-[10px] text-on-surface-variant tracking-wider hidden sm:block">
            ASCII.STUDIO
          </div>

          <nav className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <ExternalLink
              href="https://github.com/TabiqZargar/Ascii-Studio"
              className="font-label-caps text-[10px] text-on-surface-variant hover:text-primary tracking-wider"
            >
              GitHub
            </ExternalLink>

            <ExternalLink
              href="https://github.com/TabiqZargar/Ascii-Studio/issues"
              className="font-label-caps text-[10px] text-on-surface-variant hover:text-primary tracking-wider"
            >
              Report Issue
            </ExternalLink>

            <button
              onClick={() => setHelpOpen(true)}
              className="font-label-caps text-[10px] text-on-surface-variant hover:text-primary tracking-wider transition-colors"
            >
              Help
            </button>

            <button
              onClick={() => setAboutOpen(true)}
              className="font-label-caps text-[10px] text-on-surface-variant hover:text-primary tracking-wider transition-colors"
            >
              About
            </button>

            <button
              onClick={() => setPrivacyOpen(true)}
              className="font-label-caps text-[10px] text-on-surface-variant hover:text-primary tracking-wider transition-colors"
            >
              Privacy
            </button>
          </nav>

          <div className="font-label-caps text-[10px] text-on-surface-variant tracking-wider hidden sm:block">
            <span className="text-primary">RISO_CORE_V2</span>
          </div>
        </div>
      </footer>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </>
  );
}
