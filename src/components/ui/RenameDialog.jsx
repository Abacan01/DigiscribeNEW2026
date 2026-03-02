import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';

export default function RenameDialog({
  open,
  title = 'Rename',
  description = 'Enter a new name.',
  initialValue = '',
  suffix = '',
  confirmLabel = 'Save',
  loading = false,
  onConfirm,
  onClose,
}) {
  const [value, setValue] = useState(initialValue || '');

  useEffect(() => {
    if (!open) return;
    setValue(initialValue || '');
  }, [open, initialValue]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) onClose?.();
      }}
    >
      <DialogContent
        onInteractOutside={(event) => {
          if (loading) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (loading) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <label className="block text-xs font-medium text-gray-text mb-1.5">New name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !loading && value.trim()) {
                  event.preventDefault();
                  onConfirm?.(value.trim() + suffix);
                }
              }}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              placeholder="Enter new name"
              disabled={loading}
            />
            {suffix ? (
              <span className="text-sm font-medium text-gray-400">{suffix}</span>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={loading || !value.trim()}
            onClick={() => onConfirm?.(value.trim() + suffix)}
          >
            {loading ? <i className="fas fa-spinner fa-spin text-xs"></i> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
