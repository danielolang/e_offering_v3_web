import Swal from 'sweetalert2';

/** SweetAlert pop-ups in the platform palette, following the app's light / dark appearance. */
const brand = () =>
    Swal.mixin({
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        confirmButtonColor: '#1d326d',
        confirmButtonText: 'OK',
        customClass: { popup: 'font-sans rounded-xl', title: 'text-lg', htmlContainer: 'text-sm' },
    });

export function alertError(title: string, text: string) {
    return brand().fire({ icon: 'error', title, text });
}
