'use client';

import { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`fixed top-4 right-4 p-4 border rounded-lg shadow-lg z-50 ${typeStyles[type]} animate-in slide-in-from-top-2`}>
      <div className="flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-2">
          {type === 'error' && <span>❌</span>}
          {type === 'warning' && <span>⚠️</span>}
          {type === 'info' && <span>ℹ️</span>}
          {type === 'success' && <span>✅</span>}
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      </div>
    </div>
  );
}