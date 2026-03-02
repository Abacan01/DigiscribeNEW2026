import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '../../lib/utils';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;
export const AlertDialogAction = AlertDialogPrimitive.Action;

export function AlertDialogOverlay({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Overlay
      className={cn('fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out', className)}
      {...props}
    />
  );
}

export function AlertDialogContent({ className, ...props }) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        className={cn('fixed left-1/2 top-1/2 z-[91] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-100 bg-white shadow-2xl outline-none overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out', className)}
        {...props}
      />
    </AlertDialogPortal>
  );
}

export function AlertDialogHeader({ className, ...props }) {
  return <div className={cn('px-6 py-4 border-b border-gray-100', className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }) {
  return <div className={cn('px-6 py-4 flex items-center justify-end gap-2', className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }) {
  return <AlertDialogPrimitive.Title className={cn('text-base font-semibold text-dark-text', className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }) {
  return <AlertDialogPrimitive.Description className={cn('mt-1 text-sm text-gray-text leading-relaxed', className)} {...props} />;
}
