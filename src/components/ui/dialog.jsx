import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn('fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out', className)}
      {...props}
    />
  );
}

export function DialogContent({ className, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn('fixed left-1/2 top-1/2 z-[91] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-100 bg-white shadow-2xl outline-none overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out', className)}
        {...props}
      />
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn('px-6 py-4 border-b border-gray-100', className)} {...props} />;
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn('px-6 py-4 flex items-center justify-end gap-2', className)} {...props} />;
}

export function DialogTitle({ className, ...props }) {
  return <DialogPrimitive.Title className={cn('text-base font-semibold text-dark-text', className)} {...props} />;
}

export function DialogDescription({ className, ...props }) {
  return <DialogPrimitive.Description className={cn('mt-1 text-sm text-gray-text leading-relaxed', className)} {...props} />;
}
