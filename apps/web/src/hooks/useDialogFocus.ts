import { useEffect, useRef, type RefObject } from 'react';

const focusable = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';

export function useDialogFocus(ref: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  const onClose = useRef(close);
  useEffect(() => { onClose.current = close; }, [close]);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusable));
    (controls()[0] ?? dialog).focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose.current();
      }
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0] ?? dialog;
      const last = items.at(-1) ?? dialog;
      const current = document.activeElement;
      if (!dialog.contains(current) || (event.shiftKey ? current === first : current === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [ref, open]);
}
