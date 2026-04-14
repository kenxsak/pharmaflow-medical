import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface LegacyModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const sizeClasses: Record<NonNullable<LegacyModalProps['size']>, string> = {
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

const LegacyModal: React.FC<LegacyModalProps> = ({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'lg',
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 px-4 py-6">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legacy-modal-title"
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl ${sizeClasses[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Legacy workspace flow
            </div>
            <h2 id="legacy-modal-title" className="mt-2 text-2xl font-semibold text-slate-950">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? <div className="border-t border-slate-200 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
};

export default LegacyModal;
