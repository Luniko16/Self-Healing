import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  loading = false
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          text: 'text-red-900',
          button: 'bg-red-600 hover:bg-red-700',
          icon: <AlertTriangle className="w-6 h-6 text-red-600" />
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-900',
          button: 'bg-blue-600 hover:bg-blue-700',
          icon: <AlertTriangle className="w-6 h-6 text-blue-600" />
        };
      default:
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-900',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title=""
      size="sm"
      closeOnBackdropClick={!loading}
      closeOnEsc={!loading}
      footer={
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 ${styles.button} text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50`}
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col items-center space-y-4">
        <div className={`p-4 rounded-lg ${styles.bg}`}>
          {styles.icon}
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
