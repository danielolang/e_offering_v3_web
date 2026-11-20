import { toast } from '@/lib/alert';
import { usePage } from '@/lib/app';
import { type SharedData } from '@/types';
import { useEffect } from 'react';

/** Last flash shown, kept outside React so a re-mount (or both layouts) never shows it twice. */
let shownVersion = -1;

/** Shows the latest success / error message as a SweetAlert toast; renders nothing itself. */
export function FlashMessages() {
    const { flash } = usePage<SharedData>().props;
    const message = flash?.success ?? flash?.error;
    const version = (flash as { version?: number } | undefined)?.version ?? 0;

    useEffect(() => {
        if (!message || version === shownVersion) return;
        shownVersion = version;
        void toast(flash?.success ? 'success' : 'error', message);
    }, [message, version, flash?.success]);

    return null;
}
