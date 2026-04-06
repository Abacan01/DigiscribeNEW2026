import { useCallback, useMemo } from 'react';
import { useToast } from '@inspectph/react-toast-sileo';

function normalizeToastMessage(message) {
  const raw = typeof message === 'string' ? message.trim() : '';
  if (!raw) return '';

  const lowered = raw.toLowerCase();
  if (
    lowered.includes("failed to execute 'json' on 'response'") ||
    lowered.includes('unexpected end of json input') ||
    lowered.includes('unexpected token')
  ) {
    return 'Server returned an invalid response. Please try again in a moment.';
  }

  if (lowered.includes('failed to fetch') || lowered.includes('networkerror')) {
    return 'Network error. Please check your connection and try again.';
  }

  return raw;
}

const BASE_TOAST_STYLE = {
  roundness: 14,
  position: 'top-center',
  styles: {
    title: 'text-dark-text! font-semibold! text-[14px]!',
    description: 'text-dark-text/90! text-[13px]!',
  },
};

export function useAppToast() {
  const toast = useToast();

  const success = useCallback((description, title = 'Success') => {
    const normalized = normalizeToastMessage(description);
    if (!normalized) return;
    toast.success({
      ...BASE_TOAST_STYLE,
      fill: '#bbf7d0',
      title,
      description: normalized,
      duration: 8000,
    });
  }, [toast]);

  const error = useCallback((description, title = 'Something went wrong') => {
    const normalizedDescription = normalizeToastMessage(description);
    const normalizedTitle = normalizeToastMessage(title) || 'Something went wrong';
    const finalDescription = normalizedDescription || 'Please try again in a moment.';

    toast.error({
      ...BASE_TOAST_STYLE,
      fill: '#fecaca',
      title: normalizedTitle,
      description: finalDescription,
      duration: 10000,
    });
  }, [toast]);

  const info = useCallback((description, title = 'Notice') => {
    const normalized = normalizeToastMessage(description);
    if (!normalized) return;
    toast.info({
      ...BASE_TOAST_STYLE,
      fill: '#bfdbfe',
      title,
      description: normalized,
      duration: 8000,
    });
  }, [toast]);

  const warning = useCallback((description, title = 'Warning') => {
    const normalized = normalizeToastMessage(description);
    if (!normalized) return;
    toast.warning({
      ...BASE_TOAST_STYLE,
      fill: '#fde68a',
      title,
      description: normalized,
      duration: 9000,
    });
  }, [toast]);

  return useMemo(() => ({
    success,
    error,
    info,
    warning,
    promise: toast.promise,
  }), [success, error, info, warning, toast.promise]);
}
