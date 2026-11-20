import Swal, { type SweetAlertIcon, type SweetAlertOptions } from 'sweetalert2';

/*
  Every pop-up in the platform goes through SweetAlert with one branded design:
  a card with the navy-to-gold accent bar, navy title, and buttons styled like the app's own
  (buttonsStyling: false hands the buttons to these classes). The classes follow the
  light / dark appearance through the `dark:` variants.
*/
const isDark = () => document.documentElement.classList.contains('dark');

const ICON_COLOURS: Record<SweetAlertIcon, string> = {
    success: '#059669',
    error: '#e11d48',
    warning: '#c79d51',
    info: '#1d326d',
    question: '#1d326d'
};
const iconColor = (icon: SweetAlertIcon) => (isDark() && (icon === 'info' || icon === 'question') ? '#7b9bf0' : ICON_COLOURS[icon]);

const BUTTON =
    'inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none';

const modal = Swal.mixin({
    buttonsStyling: false,
    showClass: { popup: 'swal2-show eo-pop-in' },
    customClass: {
        container: 'backdrop-blur-[2px]',
        popup: 'eo-popup relative overflow-hidden rounded-2xl! border border-border bg-card! px-2 pt-3 pb-6 font-sans text-foreground! shadow-[0_24px_60px_-20px_rgb(14_34_78/0.45)]',
        title: 'text-navy! text-xl! font-bold! tracking-tight dark:text-white!',
        htmlContainer: 'text-muted-foreground! text-sm! leading-relaxed!',
        actions: 'gap-2.5! mt-6!',
        confirmButton: `${BUTTON} bg-navy text-white shadow-sm hover:bg-navy-dark focus-visible:ring-navy dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90`,
        denyButton: `${BUTTON} bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500`,
        cancelButton: `${BUTTON} border border-border bg-background text-foreground hover:bg-muted focus-visible:ring-navy`,
        input: 'rounded-lg! border-input! bg-background! text-sm! text-foreground! shadow-none!'
    }
});

function fire(icon: SweetAlertIcon, options: SweetAlertOptions) {
    return modal.fire({ icon, iconColor: iconColor(icon), confirmButtonText: 'OK', ...options });
}

export function alertSuccess(title: string, text: string) {
    return fire('success', { title, text, confirmButtonText: 'Continue' });
}

export function alertError(title: string, text: string) {
    return fire('error', { title, text });
}

export function alertInfo(title: string, text: string) {
    return fire('info', { title, text });
}

export function alertWarning(title: string, text: string) {
    return fire('warning', { title, text });
}

/**
 * "Are you sure?" before a form is sent. Resolves true only when the user confirms;
 * Cancel is focused so pressing Enter twice cannot submit by accident.
 */
export async function confirmSubmit({
    title,
    text,
    confirmText = 'Yes, Submit',
    cancelText = 'Review Again'
}: {
    title: string;
    text: string;
    confirmText?: string;
    cancelText?: string;
}): Promise<boolean> {
    const result = await fire('question', {
        title,
        text,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        focusCancel: true,
        reverseButtons: true
    });
    return result.isConfirmed;
}

/** Read-only text the user can copy by hand (fallback when the clipboard is blocked). */
export function showCopyText(title: string, value: string) {
    return fire('info', {
        title,
        input: 'text',
        inputValue: value,
        inputAttributes: { readonly: 'true', 'aria-label': title },
        didOpen: (popup) => popup.querySelector<HTMLInputElement>('input')?.select(),
        confirmButtonText: 'Done'
    });
}

/** Short, non-blocking notice in the top corner: saves, sends and server errors. */
const toaster = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    showCloseButton: true,
    timerProgressBar: true,
    buttonsStyling: false,
    customClass: {
        popup: 'eo-toast rounded-xl! border border-border bg-card! py-3! pr-3! pl-4! font-sans text-foreground! shadow-[0_18px_40px_-18px_rgb(14_34_78/0.5)]',
        title: 'text-foreground! text-sm! font-medium! leading-snug!',
        closeButton: 'text-muted-foreground! hover:text-foreground! focus:shadow-none!',
        timerProgressBar: 'bg-gold!'
    },
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

export function toast(kind: 'success' | 'error', message: string) {
    const icon = kind === 'success' ? 'success' : 'error';
    return toaster.fire({
        icon,
        iconColor: iconColor(icon),
        title: message,
        timer: kind === 'success' ? 4500 : 7000
    });
}
