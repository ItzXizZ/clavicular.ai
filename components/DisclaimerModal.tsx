'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface DisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export default function DisclaimerModal({ isOpen, onAccept }: DisclaimerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-semibold text-white">Medical Disclaimer</h2>
            </div>
            
            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4 text-sm text-zinc-400">
                <p>
                  This application is for <span className="text-white">informational and entertainment purposes only</span>. 
                  It is not intended to provide medical advice, diagnosis, or treatment.
                </p>
                
                <ul className="list-disc list-inside space-y-2 text-xs">
                  <li>All surgical and medical procedures carry risks</li>
                  <li>Always consult board-certified professionals before procedures</li>
                  <li>Results vary based on individual anatomy and genetics</li>
                  <li>Some methods discussed lack scientific validation</li>
                  <li>Body dysmorphic concerns should be addressed with mental health professionals</li>
                </ul>
                
                <p className="text-xs text-zinc-500">
                  The creators of this application are not responsible for any decisions 
                  made based on the information provided.
                </p>
                
                <p className="text-xs text-zinc-500 italic">
                  By using this app, you acknowledge that facial attractiveness is subjective 
                  and that self-worth should not be determined by appearance metrics.
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-zinc-800">
              <button
                onClick={onAccept}
                className="w-full py-3 px-4 bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold rounded-lg transition-colors"
              >
                I Understand & Accept
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

