'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    confirmBtn:
      'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-yellow-500/15',
    iconColor: 'text-yellow-400',
    confirmBtn:
      'bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/25',
  },
  default: {
    icon: Info,
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    confirmBtn:
      'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25',
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'default',
  loading = false,
}: ConfirmModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={!loading ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.21, 1.11, 0.81, 0.99] }}
            className="glass-card p-6 w-full max-w-md relative z-10"
          >
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center',
                  config.iconBg
                )}
              >
                <Icon className={cn('w-7 h-7', config.iconColor)} />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h3 className="font-display font-bold text-lg text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="btn-ghost flex-1 py-2.5 text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={cn(
                  'flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200',
                  'active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                  config.confirmBtn
                )}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
