import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, router, useForm } from '@/lib/app';
import { LoaderCircle, MailCheck, ShieldCheck } from 'lucide-react';
import { ClipboardEvent, FormEventHandler, KeyboardEvent, useRef, useState } from 'react';

const LENGTH = 6;

/**
 * Step 2 of sign-in: the emailed one-time password. Boxes accept paste of the whole code
 * and are grouped for screen readers.
 */
export default function Otp({ email, ttl, status }: { email: string; ttl: number; status?: string }) {
    const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const { setData, post, processing, errors } = useForm({ code: '' });
    const [resending, setResending] = useState(false);

    const update = (next: string[]) => {
        setDigits(next);
        setData('code', next.join(''));
    };

    const onChange = (i: number, value: string) => {
        const v = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[i] = v;
        update(next);
        if (v && i < LENGTH - 1) refs.current[i + 1]?.focus();
    };

    const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
    };

    const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
        if (!pasted) return;
        e.preventDefault();
        const next = Array(LENGTH)
            .fill('')
            .map((_, i) => pasted[i] ?? '');
        update(next);
        refs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login.otp.verify'));
    };

    const resend = () => {
        setResending(true);
        router.post(route('login.otp.resend'), {}, { preserveScroll: true, onFinish: () => setResending(false) });
    };

    return (
        <AuthLayout title="Two-step verification" description={`We sent a ${LENGTH}-digit code to ${email}. It expires in ${ttl} minutes.`}>
            <Head title="Verify sign-in" />

            <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-[#c79d51]/15 text-[#1d326d]">
                <MailCheck className="size-6 text-[#c79d51]" />
            </div>

            {status && <div className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">{status}</div>}

            <form onSubmit={submit} className="space-y-5">
                <fieldset>
                    <legend className="sr-only">One-time password</legend>
                    <div className="flex justify-center gap-2">
                        {digits.map((d, i) => (
                            <input
                                key={i}
                                ref={(el) => {
                                    refs.current[i] = el;
                                }}
                                value={d}
                                inputMode="numeric"
                                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                                aria-label={`Digit ${i + 1}`}
                                autoFocus={i === 0}
                                maxLength={1}
                                onChange={(e) => onChange(i, e.target.value)}
                                onKeyDown={(e) => onKeyDown(i, e)}
                                onPaste={onPaste}
                                className="size-11 rounded-lg border border-slate-200 bg-slate-50/50 text-center text-xl font-bold text-slate-800 outline-none transition focus:border-navy focus:bg-white focus:ring-2 focus:ring-navy/20 sm:size-12"
                            />
                        ))}
                    </div>
                    <InputError message={errors.code} className="mt-2 text-center" />
                </fieldset>

                <Button
                    type="submit"
                    className="h-11 w-full rounded-lg bg-[#0e224e] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0e224e]/20 transition-all hover:bg-[#0a1838]"
                    disabled={processing || digits.join('').length !== LENGTH}
                >
                    {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                    Verify &amp; sign in
                </Button>
            </form>

            <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <button
                    type="button"
                    onClick={resend}
                    disabled={resending}
                    className="font-semibold text-navy hover:underline disabled:opacity-50"
                >
                    {resending ? 'Sending…' : 'Resend code'}
                </button>
                <Link href={route('login')} className="hover:text-slate-800 hover:underline">
                    Use a different account
                </Link>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-4 text-[11px] font-medium text-slate-400">
                <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                <span>Bank-grade 256-bit SSL encrypted connection</span>
            </div>
        </AuthLayout>
    );
}
