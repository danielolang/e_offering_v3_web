import { Head, useForm } from '@/lib/app';
import { Eye, EyeOff, LoaderCircle, Lock, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

interface ResetPasswordProps {
    token: string;
    email: string;
}

type ResetPasswordForm = {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<ResetPasswordForm>({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };


    if (!token || !email) {
        return (
            <AuthLayout title="Set Password" description="This reset link is invalid or incomplete.">
                <Head title="Set Password" />
                <p className="text-center text-xs text-muted-foreground">
                    Open the link from your email again, or{' '}
                    <TextLink href={route('password.request')} className="font-semibold text-navy hover:underline">
                        request a new reset link
                    </TextLink>
                    .
                </p>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Set Password" description="Please choose a strong password for your account.">
            <Head title="Set Password" />

            <form onSubmit={submit} className="flex flex-col gap-4">
                <input type="hidden" name="email" autoComplete="username" value={data.email} readOnly />
                <InputError message={errors.email || errors.token} />

                <div className="grid gap-1.5">
                    <Label htmlFor="password" className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        NEW PASSWORD
                    </Label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                            <Lock className="size-4" />
                        </div>
                        <Input
                            id="password"
                            type={showPass ? 'text' : 'password'}
                            name="password"
                            autoComplete="new-password"
                            value={data.password}
                            autoFocus
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••••••"
                            className="h-11 border-border bg-muted/35 pr-10 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-navy focus:bg-card"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                            aria-label={showPass ? 'Hide password' : 'Show password'}
                        >
                            {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} />
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="password_confirmation" className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        CONFIRM NEW PASSWORD
                    </Label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                            <Lock className="size-4" />
                        </div>
                        <Input
                            id="password_confirmation"
                            type={showConfirm ? 'text' : 'password'}
                            name="password_confirmation"
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="••••••••••••"
                            className="h-11 border-border bg-muted/35 pr-10 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-navy focus:bg-card"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password_confirmation} />
                </div>

                <Button
                    type="submit"
                    className="mt-2 h-11 w-full rounded-lg bg-[#0e224e] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0e224e]/20 transition-all hover:bg-[#0a1838]"
                    disabled={processing}
                >
                    {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                    Set Password
                </Button>
            </form>

        </AuthLayout>
    );
}
