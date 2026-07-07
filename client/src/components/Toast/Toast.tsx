import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import type { ToastProps } from './Toast.types';

const Toast: React.FC<ToastProps> = ({
  message,
  isOpen,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-x-0 top-0 pointer-events-none z-250 flex items-start justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto flex items-center gap-3 bg-[#111]/90 backdrop-blur-xl border border-red-500/30 text-white px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.25)] max-w-sm w-full"
          >
            <div className="p-2 bg-red-500/15 border border-red-500/30 rounded-xl shrink-0">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {message}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all shrink-0"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
