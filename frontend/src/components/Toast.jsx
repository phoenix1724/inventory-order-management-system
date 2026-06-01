import React, { useEffect } from 'react';

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, removeToast }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const getStatusIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`toast-item toast-${toast.type} glass-card`}>
      <span className="toast-icon">{getStatusIcon(toast.type)}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => removeToast(toast.id)}>
        ×
      </button>
    </div>
  );
}
