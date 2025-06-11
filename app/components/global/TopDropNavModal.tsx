import React, { useEffect, useCallback, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react'; // Import Icon component
import { isTopDropModalOpen, openTopDropModal, closeTopDropModal } from '~/lib/stores/topDropModalStore';
import { classNames } from '~/utils/classNames';
import ChatHistoryPanel from './ChatHistoryPanel';
import SettingsGrid from './SettingsGrid'; // Import the new SettingsGrid

const modalVariants = {
  hidden: { y: '-100%', opacity: 0 },
  visible: { y: '0%', opacity: 1 },
  exit: { y: '-100%', opacity: 0 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export const TopDropNavModal: React.FC = () => {
  const isOpen = useStore(isTopDropModalOpen);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recentlyClosedRef = useRef<boolean>(false); // Proper useRef for recentlyClosed state

  const handleClose = useCallback(() => {
    closeTopDropModal();
    recentlyClosedRef.current = true; // Set recentlyClosed on manual close
    setTimeout(() => {
      recentlyClosedRef.current = false;
    }, 500); // Prevent re-opening for 500ms after close
  }, []);

  // Effect for ESC key and body overflow
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto'; // Ensure restored on cleanup
    };
  }, [isOpen, handleClose]);

  // Removed useEffect for mousemove listener to prevent automatic opening

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-transparent z-[994]" // Backdrop fully transparent, no blur
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleClose} // This is for the backdrop
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="fixed top-0 left-0 right-0 h-screen w-screen bg-black shadow-2xl z-[995] flex flex-col" // Changed to solid black background
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <button 
              onClick={handleClose} 
              className="absolute top-5 right-5 text-bolt-elements-textPrimary hover:text-bolt-accent-primary p-1.5 rounded-full transition-colors z-[996] hover:bg-bolt-elements-background-depth-3"
              aria-label="Close modal"
            >
              <Icon icon="lucide:chevron-up" className="w-5 h-5" /> {/* User specified icon */}
            </button>

            <div className="flex flex-1 h-full overflow-hidden pt-10"> {/* Added pt-10 for spacing from top edge */}
              {/* Left Section (75%) */}
              <div className="w-3/4 h-full p-6 overflow-hidden flex flex-col"> {/* Removed bg from here, cards have their own bg */}
                <h2 className="text-3xl font-bold text-bolt-elements-textPrimary mb-8"> {/* Larger/distinct font, increased mb */}
                  Quantum Neuronal Settings
                </h2>
                <div className="flex-1 overflow-y-auto modern-scrollbar"> 
                  <SettingsGrid />
                </div>
              </div>

              {/* Right Section (25%) */}
              <div className="w-1/4 h-full"> {/* Removed padding, bg, etc. as ChatHistoryPanel handles its own styling */}
                <ChatHistoryPanel />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TopDropNavModal;
