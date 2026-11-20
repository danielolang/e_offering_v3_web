import { Button } from '@/components/ui/button';
import { alertError } from '@/lib/alert';
import { cn } from '@/lib/utils';
import { CheckCircle2, FileText, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { type DragEvent, useId, useRef, useState } from 'react';

/** Mirrors the API rule for offer documents: mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png and max:20480 (KB). */
export const DOCUMENT_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
const EXTENSIONS = DOCUMENT_ACCEPT.split(',').map((e) => e.slice(1));
const MAX_MB = 20;

export const fileSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** A file is refused on selection, before anything is sent, with the same limits as the server. */
function acceptable(file: File): boolean {
    const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
    if (!EXTENSIONS.includes(extension)) {
        void alertError('Unsupported file type', `"${file.name}" is not an accepted file type. Please upload a PDF, DOC, XLS, JPG or PNG file.`);
        return false;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
        void alertError('File too large', `"${file.name}" is ${fileSize(file.size)}. The maximum size is ${MAX_MB} MB.`);
        return false;
    }
    return true;
}

export type SlotState =
    | { kind: 'empty' }
    | { kind: 'pending'; file: File }
    | { kind: 'uploaded'; name: string; size: number };

/**
 * One required supporting document: drop a file on the card or pick one. The file is held in
 * the form and saved together with the offer, so nothing is uploaded twice or left orphaned.
 */
export function DocumentSlot({
    type,
    state,
    error,
    onPick,
    onRemove
}: {
    type: string;
    state: SlotState;
    error?: string;
    onPick: (file: File) => void;
    onRemove: () => void;
}) {
    const id = useId();
    const input = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const take = (file: File | undefined) => {
        if (file && acceptable(file)) onPick(file);
    };
    const drop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        take(e.dataTransfer.files?.[0]);
    };

    const ready = state.kind !== 'empty';

    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={drop}
            className={cn(
                'relative flex flex-col gap-3 rounded-xl border p-4 transition',
                ready ? 'border-emerald-300/80 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20' : 'border-dashed',
                dragging && 'border-navy bg-navy/5 dark:border-primary dark:bg-primary/10 border-solid',
                error && !ready && 'border-rose-400'
            )}
        >
            <div className="flex items-start gap-3">
                <span
                    className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                        ready ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
                    )}
                >
                    {ready ? <CheckCircle2 className="size-5" /> : <FileText className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{type}</p>
                    {state.kind === 'empty' && <p className="text-muted-foreground text-xs">Required · PDF, DOC, XLS, JPG or PNG, up to {MAX_MB} MB</p>}
                    {state.kind === 'pending' && (
                        <p className="truncate text-xs text-emerald-700 dark:text-emerald-300" title={state.file.name}>
                            {state.file.name} · {fileSize(state.file.size)} · uploads when you save
                        </p>
                    )}
                    {state.kind === 'uploaded' && (
                        <p className="text-muted-foreground truncate text-xs" title={state.name}>
                            {state.name} · {fileSize(state.size)} · uploaded
                        </p>
                    )}
                </div>
            </div>

            <input
                ref={input}
                id={id}
                type="file"
                accept={DOCUMENT_ACCEPT}
                className="sr-only"
                aria-label={`${type} file`}
                onChange={(e) => {
                    take(e.target.files?.[0]);
                    // Cleared so picking the same file again after a fix still fires.
                    e.target.value = '';
                }}
            />
            <div className="flex flex-wrap items-center gap-2">
                {state.kind === 'empty' ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
                        <UploadCloud className="size-4" /> Choose File
                    </Button>
                ) : (
                    <>
                        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
                            <RefreshCw className="size-4" /> Replace
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                            <Trash2 className="size-4" /> Remove
                        </Button>
                    </>
                )}
                {state.kind === 'empty' && <span className="text-muted-foreground text-xs">or drop it here</span>}
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
    );
}
