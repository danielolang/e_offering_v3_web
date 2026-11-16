import { FlashMessages } from '@/components/flash-messages';
import { ThemeToggle } from '@/components/theme-toggle';
import { Link } from '@/lib/app';
import { asset } from '@/lib/url';
import { cn } from '@/lib/utils';
import { Clock3, ShieldCheck, TrendingUp, Users, Zap } from 'lucide-react';
import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    /** Wider form column for the onboarding forms. */
    wide?: boolean;
}

const highlights = [
    {
        icon: Users,
        text: 'Efficient interaction between sponsors, investors, regulators and the depository.'
    },
    {
        icon: ShieldCheck,
        text: 'Secure investments with two-step sign-in and a complete audit trail.'
    },
    {
        icon: TrendingUp,
        text: 'Real-time order book, allotment and lodgement updates.'
    },
    {
        icon: Clock3,
        text: 'Broad access to primary-market offers, end to end.'
    }
];

/**
 * FMDQ Institutional Portal authentication & onboarding layout.
 * Optimized to fit 100% within the viewport height (zero scrolling required on desktop):
 * - Slim institutional header with FMDQ mark and SEC status pill
 * - Deep navy blueprint hero with grid lines & architectural arcs
 * - Left column with headline, description & 2x2 feature cards
 * - Glass-framed floating white card for forms
 * - Slim institutional footer bar
 */
export default function AuthBrandLayout({ children, title, description, wide = false }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col justify-between bg-card antialiased lg:h-screen lg:overflow-hidden">
            {/* Top Header Bar */}
            <header className="w-full shrink-0 border-b border-border/80 bg-card px-6 py-2.5 sm:px-10 lg:px-16">
                <div className="mx-auto flex max-w-[1600px] items-center justify-between">
                    <Link href={route('home')} className="flex items-center transition hover:opacity-90">
                        {/* The logo artwork is dark-on-white, so it keeps a white chip in dark mode. */}
                        <img
                            src={asset('images/fmdq-logo.svg')}
                            alt="FMDQ"
                            className="h-6 w-auto rounded dark:box-content dark:bg-white dark:px-2 dark:py-1"
                        />
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 rounded-full border border-border/90 bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground shadow-xs">
                            <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                            <span>e-Offering Platform</span>
                        </div>
                        <ThemeToggle className="size-8" />
                    </div>
                </div>
            </header>

            {/* Main Hero & Auth Card Section */}
            <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-[#0a1c4a] via-[#0d2566] to-[#071538] px-6 py-3 sm:px-10 lg:px-16 xl:px-20">
                {/* Blueprint grid lines */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, #ffffff 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Concentric vector architectural circles */}
                <svg className="pointer-events-none absolute inset-0 size-full opacity-15" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15%" cy="50%" r="280" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="15%" cy="50%" r="480" fill="none" stroke="white" strokeWidth="1" />
                    <circle cx="85%" cy="40%" r="320" fill="none" stroke="white" strokeWidth="1" />
                    <circle cx="85%" cy="40%" r="520" fill="none" stroke="white" strokeWidth="1" strokeDasharray="6 6" />
                </svg>

                <div
                    className={cn(
                        'relative z-10 mx-auto flex w-full flex-col items-center justify-between gap-6 lg:h-full lg:flex-row lg:gap-10 xl:gap-14',
                        wide ? 'max-w-[1550px]' : 'max-w-[1440px]'
                    )}
                >
                    {/* Left Column (Brand Headline & 2x2 Feature Grid) */}
                    <div className={cn('w-full text-white', wide ? 'lg:w-5/12 xl:w-5/12' : 'lg:w-1/2 xl:w-7/12')}>
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-white uppercase shadow-xs backdrop-blur-md">
                            <Zap className="size-3.5 text-white/90" />
                            <span>FMDQ E-OFFERING</span>
                        </div>

                        <h1 className="mt-3.5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px] xl:text-[50px] xl:leading-[1.1]">
                            e-Offering Platform
                        </h1>

                        <p className="mt-2.5 max-w-xl text-xs leading-relaxed font-normal text-white/80 sm:text-sm lg:text-base">
                            Unlocking investment opportunities through automated, standardised primary market transactions.
                        </p>

                        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:gap-3">
                            {highlights.map(({ icon: Icon, text }) => (
                                <div
                                    key={text}
                                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-3 shadow-xs backdrop-blur-md transition hover:bg-white/[0.08]"
                                >
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#c79d51] text-[#0c2356] shadow-sm sm:size-10">
                                        <Icon className="size-4.5" />
                                    </div>
                                    <span className="text-xs leading-snug font-medium text-white/95 sm:text-[13px]">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column (Glass-Framed Floating White Card) */}
                    <div
                        className={cn(
                            // On desktop the page is locked to the viewport, so the card is capped to the
                            // available height and only the form inside it scrolls.
                            'flex w-full justify-center lg:h-full lg:items-center lg:justify-end',
                            wide ? 'w-full lg:w-7/12 xl:w-7/12 max-w-3xl xl:max-w-4xl' : 'w-full lg:w-1/2 xl:w-5/12 max-w-[460px]'
                        )}
                    >
                        <div className="w-full rounded-[24px] border border-white/20 bg-white/10 p-2 shadow-2xl backdrop-blur-md lg:flex lg:max-h-full lg:flex-col">
                            <div className="w-full rounded-2xl bg-card p-5 text-foreground shadow-sm [scrollbar-width:thin] sm:p-6 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:p-7">
                                {title && (
                                    <h2 className="text-center text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                                        {title}
                                    </h2>
                                )}
                                {description && <p className="mt-0.5 text-center text-xs text-muted-foreground">{description}</p>}
                                <div className="mt-4">
                                    <FlashMessages />
                                    {children}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Institutional Footer Bar */}
            <footer className="w-full shrink-0 border-t border-border/80 bg-card px-6 py-2.5 text-xs text-muted-foreground sm:px-10 lg:px-16">
                <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-2 sm:flex-row">
                    <span>Powered by iQx Consult Limited · &copy; {new Date().getFullYear()} FMDQ Group PLC</span>
                    <div className="flex items-center gap-6 font-medium text-muted-foreground sm:gap-8">
                        <a href="#" className="transition-colors hover:text-foreground">
                            Security Policy
                        </a>
                        <a href="#" className="transition-colors hover:text-foreground">
                            Terms of Service
                        </a>
                        <a href="#" className="transition-colors hover:text-foreground">
                            Depository Help Desk
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
