import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { Head, Link } from '@/lib/app';
import { cn } from '@/lib/utils';
import { ArrowRight, Building2, Landmark, ShieldCheck, UserRound } from 'lucide-react';

const icons = {
    retail: UserRound,
    institutional: Building2,
    tsp: Landmark,
    regulator: ShieldCheck
};

const badges: Record<string, string> = {
    retail: 'BVN Required',
    institutional: 'CAC Documentation',
    tsp: 'Registration Member',
    regulator: 'Statutory Regulator'
};

const hints: Record<string, string> = {
    retail: 'Individual Accounts',
    institutional: 'Corporate Entities',
    tsp: 'Sponsoring Institutions',
    regulator: 'SEC/CBN Officials'
};

/** Bolds defined terms written as ("QII"), e.g. "QII", "Non-QII", "SEC", "CBN". */
function emphasiseTerms(text: string) {
    return text.split(/("[^"]+")/g).map((part, i) =>
        /^"[^"]+"$/.test(part) ? (
            <strong key={i} className="text-foreground font-semibold">
                {part}
            </strong>
        ) : (
            part
        )
    );
}

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
                                'group bg-card flex flex-col justify-between rounded-xl border p-3.5 transition-all outline-hidden sm:p-4',
                                'hover:border-navy hover:bg-primary/10 hover:-translate-y-0.5 hover:shadow-md',
                                'dark:hover:border-primary dark:hover:bg-primary/15',
                                'focus-visible:bg-primary/10 focus-visible:ring-navy/30 focus-visible:ring-4'
                            )}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="bg-navy/10 text-navy group-hover:bg-navy flex size-9 items-center justify-center rounded-lg transition-colors group-hover:text-white sm:size-10 dark:text-white">
                                        <Icon className="size-4.5" />
                                    </span>
                                    <span className="bg-muted text-muted-foreground rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold">
                                        {badges[key]}
                                    </span>
                                </div>
                                <h3 className="text-foreground group-hover:text-navy mt-2 text-sm font-bold transition-colors sm:text-[15px] dark:group-hover:text-white">
                                    {type.label}
                                </h3>
                                <p className="text-foreground mt-1 line-clamp-3 text-xs leading-relaxed">
                                    {emphasiseTerms(type.description)}
                                </p>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t pt-2 text-[11px]">
                                <span className="text-muted-foreground font-medium">{hints[key]}</span>
                                <span className="text-navy dark:text-gold-light inline-flex items-center gap-1 font-bold transition-transform group-hover:translate-x-0.5">
                                    Continue <ArrowRight className="size-3" />
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="text-muted-foreground mt-3.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10.5px]">
                <span>BVN · Bank Verification</span>
                <span>•</span>
                <span>CAC · Corporate Affairs</span>
                <span>•</span>
                <span>QII · Qualified Institutional</span>
                <span>•</span>
                <span>TSP/RM · Sponsor</span>
            </div>

            <p className="text-muted-foreground mt-3 text-center text-xs">
                Already have an account?{' '}
                <Link href={route('login')} className="text-foreground font-bold hover:underline">
                    Sign In
                </Link>
            </p>
        </AuthBrandLayout>
    );
}
