import { Head, useForm } from '@/lib/app';
import { Eye, EyeOff, LoaderCircle, Lock, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ConfirmPassword() {
    const [show, setShow] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout
            title="Confirm your password"
            description="This is a secure area of the application. Please confirm your password before continuing."
        >
            <Head title="Confirm password" />

            <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid gap-1.5">
                    <Label htmlFor="password" className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                        PASSWORD
                    </Label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <Lock className="size-4" />
                        </div>
                        <Input
                            id="password"
                            type={show ? 'text' : 'password'}
                            name="password"
                            placeholder="••••••••••••"
                            autoComplete="current-password"
                            value={data.password}
                            autoFocus
                            onChange={(e) => setData('password', e.target.value)}
                            className="h-11 border-slate-200 bg-slate-50/70 pr-10 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy focus:bg-white"
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

                <Button
                    type="submit"
                    className="mt-2 h-11 w-full rounded-lg bg-[#0e224e] py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0e224e]/20 transition-all hover:bg-[#0a1838]"
                    disabled={processing}
                >
                    {processing && <LoaderCircle className="mr-2 size-4 animate-spin" />}
                    Confirm password
                </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-1.5 pt-2 text-[11px] font-medium text-slate-400">
                <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                <span>Bank-grade 256-bit SSL encrypted connection</span>
            </div>
        </AuthLayout>
    );
}
