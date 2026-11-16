import { Head, Link, useForm } from '@/lib/app';
import { Eye, EyeOff, LoaderCircle, Lock, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

/**
 * Step 1 of sign-in (email + password). A one-time password is then emailed (CR "Login").
 */
export default function Login({ status }: { status?: string }) {
    const [show, setShow] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<{ email: string; password: string; remember: boolean }>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout title="Sign in" description="Use your registered email address and password.">
            <Head title="Sign in" />

            {status && <div className="mb-3 rounded-md bg-emerald-50 px-3 py-1.5 text-center text-xs font-medium text-emerald-700">{status}</div>}

            <form className="flex flex-col gap-3.5" onSubmit={submit}>
                <div className="grid gap-1.5">
                    <Label htmlFor="email" className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                        EMAIL ADDRESS
                    </Label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <div className="flex size-5 items-center justify-center rounded-full bg-slate-200/90 text-[11px] font-bold text-slate-600">
                                @
                            </div>
                        </div>
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="u913128959"
                            className="h-10.5 border-slate-200 bg-slate-50/70 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy focus:bg-white"
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                            PASSWORD
                        </Label>
                        <TextLink href={route('password.request')} className="text-xs font-semibold text-slate-600 hover:text-navy hover:underline">
                            Forgot password?
                        </TextLink>
                    </div>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Lock className="size-4" />
                        </div>
                        <Input
                            id="password"
                            type={show ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••••••"
                            className="h-10.5 border-slate-200 bg-slate-50/70 pr-10 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy focus:bg-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShow(!show)}
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                            aria-label={show ? 'Hide password' : 'Show password'}
                        >
                            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                    <Checkbox
                        id="remember"
                        checked={data.remember}
                        onCheckedChange={(v) => setData('remember', v === true)}
                        className="size-4 border-slate-300 data-[state=checked]:border-navy data-[state=checked]:bg-navy"
                    />
                    <Label htmlFor="remember" className="cursor-pointer text-xs font-normal text-slate-600">
                        Keep me signed in on this device
                    </Label>
                </div>

                <Button
                    type="submit"
                    className="mt-1 h-10.5 w-full rounded-lg bg-[#0e224e] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0e224e]/20 transition-all hover:bg-[#0a1838]"
                    disabled={processing}
                >
                    {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                    {processing ? 'Signing in…' : 'Sign in'}
                </Button>
            </form>

            <p className="mt-3.5 text-center text-xs text-slate-600">
                Don&apos;t have an account?{' '}
                <Link href={route('onboarding.choose')} className="font-bold text-slate-900 hover:underline">
                    Sign up
                </Link>
            </p>

            <div className="mt-3.5 flex items-center justify-center gap-1.5 pt-2 text-[11px] font-medium text-slate-400">
                <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                <span>Bank-grade 256-bit SSL encrypted connection</span>
            </div>
        </AuthLayout>
    );
}
