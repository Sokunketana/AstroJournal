import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this entry? Your star and streak will be reverted.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center p-6 bg-black/80"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-sm w-full relative shadow-2xl overflow-hidden"
          >
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-blue-500 to-purple-500" />

            {/* Close button */}
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                <AlertTriangle size={28} className="text-purple-400" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-8">
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wide text-gray-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
