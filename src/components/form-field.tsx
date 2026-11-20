import InputError from '@/components/input-error';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { alertError } from '@/lib/alert';
import { ChangeEvent, type ReactNode, useId } from 'react';

/** Label + control + hint + inline error (legacy forms only showed errors in pop-ups). */
export function Field({
    label,
    error,
    hint,
    required,
    children,
    className,
    htmlFor
}: {
    label: ReactNode;
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    children: ReactNode;
    className?: string;
    htmlFor?: string;
}) {
    return (
        <div className={cn('grid min-w-0 gap-1.5', className)}>
            <Label htmlFor={htmlFor}>
                {label}
                {required && <span className="text-destructive"> *</span>}
            </Label>
            {children}
            {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
            <InputError message={error} />
        </div>
    );
}

export function TextField({
    label,
    value,
    onChange,
    error,
    hint,
    required,
    type = 'text',
    placeholder,
    className,
    ...rest
}: {
    label: ReactNode;
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    type?: string;
    placeholder?: string;
    className?: string;
    [key: string]: unknown;
}) {
    const id = useId();
    return (
        <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
            {type === 'date' ? (
                // One date picker across the app instead of each browser's own calendar.
                <DateTimePicker
                    id={id}
                    withTime={false}
                    value={value == null ? '' : String(value)}
                    onChange={onChange}
                    min={rest.min as string | undefined}
                    max={rest.max as string | undefined}
                    required={required}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    onBlur={rest.onBlur as (() => void) | undefined}
                />
            ) : (
                <Input
                    id={id}
                    type={type}
                    value={value ?? ''}
                    required={required}
                    placeholder={placeholder}
                    aria-invalid={!!error}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
                    {...rest}
                />
            )}
        </Field>
    );
}

/** Naira amount with live thousands separators (the legacy number inputs broke on commas). */
export function MoneyField({
    label,
    value,
    onChange,
    error,
    hint,
    required,
    prefix = '₦',
    className
}: {
    label: ReactNode;
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    prefix?: string;
    className?: string;
}) {
    const id = useId();
    const raw = String(value ?? '').replace(/,/g, '');
    const [whole, frac] = raw.split('.');
    const display = whole === '' ? '' : Number(whole).toLocaleString('en-US') + (frac !== undefined ? '.' + frac : '');

    return (
        <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
            {/* The prefix sits in the flow beside the input, so any prefix length lines up without padding guesses. */}
            <div
                className={cn(
                    'border-input bg-background ring-offset-background focus-within:ring-ring flex h-10 w-full items-center gap-1.5 rounded-md border px-3 focus-within:ring-2 focus-within:ring-offset-2',
                    error && 'border-rose-400'
                )}
            >
                <span className="text-muted-foreground shrink-0 text-base whitespace-nowrap select-none md:text-sm">{prefix}</span>
                <input
                    id={id}
                    inputMode="decimal"
                    className="h-full min-w-0 flex-1 bg-transparent text-base tabular-nums outline-hidden md:text-sm"
                    value={Number.isNaN(Number(whole)) ? raw : display}
                    required={required}
                    aria-invalid={!!error}
                    onChange={(e) => {
                        const next = e.target.value.replace(/[^\d.]/g, '');
                        const parts = next.split('.');
                        onChange(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : next);
                    }}
                />
            </div>
        </Field>
    );
}

export function SelectField({
    label,
    value,
    onChange,
    options,
    error,
    hint,
    required,
    placeholder = 'Select…',
    className
}: {
    label: ReactNode;
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    options: { value: string | number; label: string }[];
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    placeholder?: string;
    className?: string;
}) {
    const id = useId();
    return (
        <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
            <select
                id={id}
                value={value ?? ''}
                required={required}
                aria-invalid={!!error}
                onChange={(e) => onChange(e.target.value)}
                className="border-input bg-background focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] aria-invalid:border-rose-400"
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </Field>
    );
}

/** '.pdf,.jpg,.jpeg,.png' → 'PDF, JPG or PNG' (JPEG folded into JPG). */
function describeTypes(extensions: string[]): string {
    const names = [
        ...new Set(extensions.map((e) => (e === 'jpeg' ? 'JPG' : e === 'docx' ? 'DOC' : e === 'xlsx' ? 'XLS' : e.toUpperCase())))
    ];
    return names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}` : (names[0] ?? '');
}

/**
 * File picker that shows the chosen file name and the accepted types / size. A file of the
 * wrong type or over the limit is refused on selection with a pop-up, before upload;
 * the limits mirror the server's mimes / max rules for each upload.
 */
export function FileField({
    label,
    onChange,
    error,
    hint,
    required,
    accept = '.pdf,.jpg,.jpeg,.png',
    maxSizeMB = 5,
    file,
    className,
    disabled = false
}: {
    label: ReactNode;
    onChange: (file: File | null) => void;
    disabled?: boolean;
    error?: string;
    hint?: ReactNode;
    required?: boolean;
    accept?: string;
    maxSizeMB?: number;
    file?: File | null;
    className?: string;
}) {
    const id = useId();
    const extensions = accept
        .split(',')
        .map((e) => e.trim().replace(/^\./, '').toLowerCase())
        .filter(Boolean);
    const types = describeTypes(extensions);

    const pick = (e: ChangeEvent<HTMLInputElement>) => {
        const chosen = e.target.files?.[0] ?? null;
        // Cleared so picking the same file again after a fix still fires onChange.
        e.target.value = '';
        if (!chosen) return;

        const extension = chosen.name.includes('.') ? chosen.name.split('.').pop()!.toLowerCase() : '';
        if (extensions.length && !extensions.includes(extension)) {
            void alertError('Unsupported file type', `"${chosen.name}" is not an accepted file type. Please upload a ${types} file.`);
            onChange(null);
            return;
        }
        if (chosen.size > maxSizeMB * 1024 * 1024) {
            void alertError(
                'File too large',
                `"${chosen.name}" is ${(chosen.size / 1024 / 1024).toFixed(1)} MB. The maximum size is ${maxSizeMB} MB.`
            );
            onChange(null);
            return;
        }
        onChange(chosen);
    };

    return (
        <Field
            label={label}
            error={error}
            hint={hint ?? `${types}, up to ${maxSizeMB} MB.`}
            required={required}
            className={className}
            htmlFor={id}
        >
            {/* The real input comes first so the visible box can show its keyboard focus (peer-focus-visible). */}
            <input
                id={id}
                type="file"
                accept={accept}
                disabled={disabled}
                className="peer sr-only"
                aria-invalid={!!error}
                onChange={pick}
            />
            <label
                htmlFor={id}
                className={cn(
                    // Styled like the text inputs beside it: solid border, same height and focus ring.
                    'border-input bg-background ring-offset-background hover:border-navy/50 peer-focus-visible:ring-ring flex h-10 min-w-0 cursor-pointer items-center gap-3 rounded-md border px-2 text-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
                    error && 'border-rose-400',
                    disabled && 'hover:border-input cursor-not-allowed opacity-60'
                )}
            >
                <span className="bg-navy/10 text-navy shrink-0 rounded px-2 py-1 text-xs font-medium whitespace-nowrap dark:text-white">
                    Choose file
                </span>
                {/* min-w-0 lets a long name truncate instead of widening the field. */}
                <span className="text-muted-foreground min-w-0 truncate" title={file?.name}>
                    {file ? file.name : 'No file selected'}
                </span>
            </label>
        </Field>
    );
}
