import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../Modal';
import Button from '../Button';
import type { ConfirmDialogProps } from './ConfirmDialog.types';

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
    <Modal isOpen={isOpen} onClose={onCancel} maxWidth="sm">
      {/* Icon */}
      <div className="flex justify-center mb-5">
        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
          <AlertTriangle size={28} className="text-gray-300" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{message}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel} fullWidth>
          {cancelLabel}
        </Button>
        <Button variant="primary" onClick={onConfirm} fullWidth>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
