import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { Head, Link } from '@/lib/app';
import { cn } from '@/lib/utils';
import { ArrowRight, Building2, Landmark, ShieldCheck, UserRound } from 'lucide-react';

const icons = {
    retail: UserRound,
    institutional: Building2,
    tsp: Landmark,
    regulator: ShieldCheck,
};

const badges: Record<string, string> = {
    retail: 'BVN Required',
    institutional: 'CAC Documentation',
    tsp: 'Registration Member',
    regulator: 'Statutory Regulator',
};

const hints: Record<string, string> = {
    retail: 'Individual accounts',
    institutional: 'Corporate entities',
    tsp: 'Sponsoring institutions',
    regulator: 'SEC / CBN officials',
};

/** CR s3: four account types, each with a clear, compact card presentation fitting cleanly on screen. */
export default function Choose({ accountTypes }: { accountTypes: Record<string, { label: string; description: string }> }) {
    return (
        <AuthBrandLayout title="Select Account Type" description="Choose the account type that describes you to continue." wide>
            <Head title="Register" />

            <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(accountTypes).map(([key, type]) => {
                    const Icon = icons[key as keyof typeof icons] ?? UserRound;
                    return (
                        <Link
                            key={key}
                            href={route('onboarding.form', key)}
                            className={cn(
                                'group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3.5 transition-all outline-hidden hover:-translate-y-0.5 hover:border-navy hover:shadow-md sm:p-4',
                            )}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-[#0c2356] transition-colors group-hover:bg-[#0c2356] group-hover:text-white sm:size-10">
                                        <Icon className="size-4.5" />
                                    </span>
                                    <span className="rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-0.5 text-[10.5px] font-semibold text-slate-600">
                                        {badges[key]}
                                    </span>
                                </div>
                                <h3 className="mt-2 text-sm font-bold text-slate-900 transition-colors group-hover:text-navy sm:text-[15px]">
                                    {type.label}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                                    {type.description}
                                </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                                <span className="font-medium text-slate-400">{hints[key]}</span>
                                <span className="inline-flex items-center gap-1 font-bold text-navy transition-transform group-hover:translate-x-0.5">
                                    Continue <ArrowRight className="size-3" />
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10.5px] text-slate-400">
                <span>BVN · Bank Verification</span>
                <span>•</span>
                <span>CAC · Corporate Affairs</span>
                <span>•</span>
                <span>QII · Qualified Institutional</span>
                <span>•</span>
                <span>TSP/RM · Sponsor</span>
            </div>

            <p className="mt-3 text-center text-xs text-slate-600">
                Already have an account?{' '}
                <Link href={route('login')} className="font-bold text-slate-900 hover:underline">
                    Sign in
                </Link>
            </p>
        </AuthBrandLayout>
    );
}
