'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ModalProps {
    /** Whether the modal is open. When false, nothing is rendered. */
    isOpen: boolean;
    /** Called when the user requests close (Escape, backdrop click, or programmatically). */
    onClose: () => void;
    /** Dialog body. Provide the modal's own header/content/footer markup here. */
    children: ReactNode;
    /**
     * Accessible name for the dialog. Provide either `ariaLabel` (a string) or
     * `ariaLabelledBy` (the id of a visible heading inside the dialog).
     */
    ariaLabel?: string;
    ariaLabelledBy?: string;
    /** Whether clicking the backdrop closes the modal. Defaults to true. */
    closeOnBackdropClick?: boolean;
    /** Whether Escape closes the modal. Defaults to true. */
    closeOnEscape?: boolean;
    /** Extra classes for the centered dialog panel container. */
    className?: string;
    /** Extra classes for the full-screen overlay. */
    overlayClassName?: string;
    /** Forwarded to the overlay element for test selectors. */
    'data-testid'?: string;
}

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Shared accessible modal primitive. Owns dialog semantics and focus management:
 * `role="dialog"` + `aria-modal="true"`, accessible name, initial focus into the dialog,
 * focus trap (Tab cycles within), Escape-to-close, backdrop-click-to-close, and focus
 * restoration to the previously focused element on close.
 *
 * Migrated modals keep their own header/body/footer markup as `children`; this primitive
 * only replaces the outer overlay + dialog container.
 */
export function Modal({
    isOpen,
    onClose,
    children,
    ariaLabel,
    ariaLabelledBy,
    closeOnBackdropClick = true,
    closeOnEscape = true,
    className,
    overlayClassName,
    'data-testid': dataTestId,
}: Readonly<ModalProps>) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const previouslyFocusedRef = useRef<HTMLElement | null>(null);

    // Capture the trigger and move focus into the dialog on open; restore on close/unmount.
    useEffect(() => {
        if (!isOpen) return;

        previouslyFocusedRef.current = (document.activeElement as HTMLElement) ?? null;

        const dialog = dialogRef.current;
        if (dialog) {
            const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            const target = focusable[0] ?? dialog;
            target.focus();
        }

        return () => {
            previouslyFocusedRef.current?.focus?.();
        };
    }, [isOpen]);

    // Escape-to-close and Tab focus trap.
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (closeOnEscape && event.key === 'Escape') {
                event.stopPropagation();
                onClose();
                return;
            }

            if (event.key !== 'Tab') return;

            const dialog = dialogRef.current;
            if (!dialog) return;

            // The selector already excludes [disabled] and tabindex="-1"; further exclude
            // explicitly hidden nodes. We deliberately avoid an `offsetParent`/layout check
            // because jsdom reports `offsetParent === null` for every element.
            const focusable = Array.from(
                dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
            ).filter((el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');

            if (focusable.length === 0) {
                event.preventDefault();
                dialog.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable.at(-1)!;
            const active = document.activeElement as HTMLElement | null;

            if (event.shiftKey) {
                if (active === first || active === dialog || !dialog.contains(active)) {
                    event.preventDefault();
                    last.focus();
                }
            } else if (active === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [isOpen, onClose, closeOnEscape]);

    if (!isOpen) return null;

    return (
        <div // NOSONAR(S6848) — backdrop is a convenience mouse-dismiss; the keyboard path is Esc (handler above) + the dialog's own close control. A native control here would be a bogus tab stop. ARIA-correct: dismiss guarded by e.target===e.currentTarget.
            data-testid={dataTestId}
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center p-4',
                overlayClassName,
            )}
            onMouseDown={(e) => {
                if (closeOnBackdropClick && e.target === e.currentTarget) onClose();
            }}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
            <div // NOSONAR(S6819) — role="dialog"+aria-modal kept deliberately: native dialog relies on showModal()/close() which jsdom does not implement, so migrating would break every modal test for a one-finding payoff. Focus trap + Esc + restore are handled here.
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel}
                aria-labelledby={ariaLabelledBy}
                tabIndex={-1}
                className={cn('relative w-full max-w-lg focus:outline-none', className)}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
