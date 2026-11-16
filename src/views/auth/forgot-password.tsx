import { Head, useForm } from '@/lib/app';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout title="Forgot password" description="Enter your registered email address to receive a password reset link.">
            <Head title="Forgot password" />

            {status && <div className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">{status}</div>}

            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="email" className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        EMAIL ADDRESS
                    </Label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <div className="flex size-5 items-center justify-center rounded-full bg-border/90 text-[11px] font-bold text-muted-foreground">
                                @
                            </div>
                        </div>
                        <Input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            value={data.email}
                            autoFocus
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="name@company.com"
                            className="h-11 border-border bg-muted/50/70 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-navy focus:bg-card"
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <Button
                    type="submit"
                    className="mt-2 h-11 w-full rounded-lg bg-[#0e224e] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0e224e]/20 transition-all hover:bg-[#0a1838]"
                    disabled={processing}
                >
                    {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                    Email password reset link
                </Button>
            </form>

            <div className="mt-5 space-x-1 text-center text-xs text-muted-foreground">
                <span>Or, return to</span>
                <TextLink href={route('login')} className="font-semibold text-foreground hover:underline">
                    Sign in
                </TextLink>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 pt-2 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                <span>Bank-grade 256-bit SSL encrypted connection</span>
            </div>
        </AuthLayout>
    );
}
