import { Head, Link } from '@/lib/app';
import { asset } from '@/lib/url';
import {
    ArrowRight,
    CheckCircle2,
    Clock3,
    Globe2,
    Landmark,
    Layers,
    LockKeyhole,
    Menu,
    ShieldCheck,
    UsersRound,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface WelcomeProps {
    stats?: {
        live_offers?: number;
        sponsors?: number;
    };
}

export default function Welcome({ stats }: WelcomeProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const liveOffersCount = stats?.live_offers !== undefined && stats.live_offers > 0 ? stats.live_offers : 5;
    const sponsorsCount = stats?.sponsors !== undefined && stats.sponsors > 0 ? stats.sponsors : 3;

    return (
        <div className="min-h-screen bg-white font-sans antialiased text-slate-900 selection:bg-[#c59a4c] selection:text-[#0a1c4a]">
            <Head title="Connecting Opportunities, Empowering Investments | FMDQ e-Offering Platform" />

            {/* 1. TOP NAVIGATION BAR */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 sm:px-8 lg:px-12">
                    {/* Brand / Logo */}
                    <div className="flex items-center">
                        <Link href={route('home')} className="flex items-center gap-3">
                            <img src={asset('images/fmdq-logo.svg')} alt="FMDQ" className="h-6 w-auto" />
                            <div className="h-4 w-px bg-slate-300" />
                            <span className="text-[12px] font-bold tracking-wider text-slate-800 uppercase">
                                E-OFFERING PLATFORM
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Center Nav Links */}
                    <nav className="hidden items-center gap-7 text-[13px] font-medium text-slate-600 md:flex lg:gap-9">
                        <a href="#offers" className="transition hover:text-slate-900">
                            Offers
                        </a>
                        <a href="#sponsors" className="transition hover:text-slate-900">
                            Sponsors
                        </a>
                        <a href="#why-e-offering" className="transition hover:text-slate-900">
                            Why e-Offering
                        </a>
                        <a href="#regulations" className="transition hover:text-slate-900">
                            Regulations
                        </a>
                        <a href="#about" className="transition hover:text-slate-900">
                            About FMDQ
                        </a>
                    </nav>

                    {/* Right Action Buttons */}
                    <div className="hidden items-center gap-5 md:flex">
                        <Link
                            href={route('login')}
                            className="text-[13px] font-semibold text-slate-700 transition hover:text-slate-950"
                        >
                            Sign in
                        </Link>
                        <Link
                            href={route('onboarding.choose')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0e224e] px-4 py-2 text-[13px] font-semibold text-white shadow-xs transition hover:bg-[#153472] active:scale-[0.99]"
                        >
                            Register
                            <ArrowRight className="size-3.5" />
                        </Link>
                    </div>

                    {/* Mobile Menu Hamburger Button */}
                    <div className="flex md:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Toggle navigation menu"
                        >
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="border-b border-slate-200 bg-white px-6 py-4 md:hidden">
                        <div className="flex flex-col space-y-3 text-sm font-medium text-slate-700">
                            <a
                                href="#offers"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-1 transition hover:text-slate-950"
                            >
                                Offers
                            </a>
                            <a
                                href="#sponsors"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-1 transition hover:text-slate-950"
                            >
                                Sponsors
                            </a>
                            <a
                                href="#why-e-offering"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-1 transition hover:text-slate-950"
                            >
                                Why e-Offering
                            </a>
                            <a
                                href="#regulations"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-1 transition hover:text-slate-950"
                            >
                                Regulations
                            </a>
                            <a
                                href="#about"
                                onClick={() => setMobileMenuOpen(false)}
                                className="py-1 transition hover:text-slate-950"
                            >
                                About FMDQ
                            </a>
                            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
                                <Link
                                    href={route('login')}
                                    className="block rounded-lg py-2 text-center font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href={route('onboarding.choose')}
                                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0e224e] py-2.5 text-center text-sm font-semibold text-white"
                                >
                                    Register
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* 2. HERO SECTION */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1c4a] via-[#0d2566] to-[#071538] text-white pt-14 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
                {/* Blueprint grid lines */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.06]"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, #ffffff 1px, transparent 1px),
                            linear-gradient(to bottom, #ffffff 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Sweeping Golden Concentric Vector Arcs */}
                <div className="pointer-events-none absolute -bottom-36 -right-36 size-[560px] rounded-full border-[2.5px] border-[#c59a4c]/30" />
                <div className="pointer-events-none absolute -bottom-56 -right-56 size-[760px] rounded-full border-[2px] border-[#c59a4c]/20" />
                <div className="pointer-events-none absolute -bottom-80 -right-80 size-[980px] rounded-full border-[1.5px] border-[#c59a4c]/15" />
                <div className="pointer-events-none absolute -bottom-[420px] -right-[420px] size-[1220px] rounded-full border border-[#c59a4c]/10" />

                <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                    <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
                        {/* Left Column: Headline, subtext, actions, trust badges */}
                        <div className="lg:col-span-7 xl:col-span-7">
                            {/* Chip Badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1 text-xs font-semibold tracking-wider text-amber-300 uppercase backdrop-blur-sm">
                                <span className="size-2 rounded-full bg-[#c59a4c] shadow-[0_0_8px_#c59a4c]" />
                                <span>FMDQ E-OFFERING</span>
                            </div>

                            {/* Headline */}
                            <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[54px] lg:leading-[1.12]">
                                Connecting
                                <br />
                                Opportunities,
                                <br />
                                Empowering
                                <br />
                                Investments
                            </h1>

                            {/* Subtitle */}
                            <p className="mt-6 max-w-xl text-base text-white/80 sm:text-lg leading-relaxed font-normal">
                                An end-to-end digital channel for the distribution of equity and fixed-income securities:
                                offer creation, investor subscription, book building, allotment, regulatory review and
                                depository lodgement.
                            </p>

                            {/* Actions */}
                            <div className="mt-8 flex flex-wrap items-center gap-4">
                                <Link
                                    href={route('onboarding.choose')}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#c59a4c] px-6 py-3 text-sm font-semibold text-[#0a1c4a] shadow-md transition hover:bg-[#d4a757] active:scale-[0.99]"
                                >
                                    Get started
                                    <ArrowRight className="size-4" />
                                </Link>
                                <Link
                                    href={route('login')}
                                    className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-[#172b5a]/60 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/10 hover:border-white/40"
                                >
                                    Sign in
                                </Link>
                            </div>

                            {/* Trust badges */}
                            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs sm:text-sm text-white/85">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-[#c59a4c] shrink-0" />
                                    <span>SEC Approved Framework</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-[#c59a4c] shrink-0" />
                                    <span>Instant Depository Settlement</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-[#c59a4c] shrink-0" />
                                    <span>Full Audit Trail</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Floating Glass Stat Cards */}
                        <div className="lg:col-span-5 xl:col-span-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Stat Card 1: Offers on the platform */}
                                <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-6 backdrop-blur-md shadow-2xl transition hover:border-white/25 hover:bg-white/[0.12]">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-[#d4a757]">
                                        <Landmark className="size-5" />
                                    </div>
                                    <div className="mt-5 flex items-baseline gap-2.5">
                                        <span className="text-4xl font-bold tracking-tight text-white">
                                            {liveOffersCount}
                                        </span>
                                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                                            +2 live
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-white/80">Offers on the platform</p>
                                    <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-white/70">
                                        <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1">
                                            Equities & Debt
                                        </span>
                                        <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1">
                                            Active Book
                                        </span>
                                    </div>
                                </div>

                                {/* Stat Card 2: Registered sponsors */}
                                <div className="rounded-2xl border border-white/15 bg-white/[0.08] p-6 backdrop-blur-md shadow-2xl transition hover:border-white/25 hover:bg-white/[0.12]">
                                    <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-[#d4a757]">
                                        <UsersRound className="size-5" />
                                    </div>
                                    <div className="mt-5 flex items-baseline gap-2.5">
                                        <span className="text-4xl font-bold tracking-tight text-white">
                                            {sponsorsCount}
                                        </span>
                                        <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                            Verified
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-white/80">Registered sponsors</p>
                                    <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-white/70">
                                        <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1">
                                            Issuing Houses
                                        </span>
                                        <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1">
                                            Accredited
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. WHY FMDQ E-OFFERING? SECTION */}
            <section id="why-e-offering" className="bg-white py-20 px-6 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-[#0a1c4a] sm:text-4xl">
                            Why FMDQ e-Offering?
                        </h2>
                        <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-[#c59a4c]" />
                        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                            A unified, reliable and high-integrity infrastructure designed to eliminate offering
                            bottlenecks across primary and secondary capital distributions.
                        </p>
                    </div>

                    {/* 4 Alternating Feature Cards */}
                    <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Card 1: Navy */}
                        <div className="flex flex-col justify-between rounded-2xl bg-[#0e224e] p-7 text-white shadow-xl">
                            <div>
                                <div className="flex size-11 items-center justify-center rounded-full bg-white/10 text-amber-300">
                                    <Layers className="size-5" />
                                </div>
                                <span className="mt-5 block text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                                    WORKFLOW UNIFICATION
                                </span>
                                <h3 className="mt-2 text-xl font-bold text-white">Efficient Interaction</h3>
                                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-white/80">
                                    Sponsors, investors, regulators and the depository work on one standardised workflow.
                                </p>
                            </div>
                            <div className="mt-8 border-t border-white/10 pt-4">
                                <span className="inline-block rounded-md bg-white/10 px-3 py-1 text-xs text-white/90">
                                    Single window clearance
                                </span>
                            </div>
                        </div>

                        {/* Card 2: Warm Gold */}
                        <div className="flex flex-col justify-between rounded-2xl bg-[#c59a4c] p-7 text-[#0a1c4a] shadow-xl">
                            <div>
                                <div className="flex size-11 items-center justify-center rounded-full bg-black/10 text-[#0a1c4a]">
                                    <LockKeyhole className="size-5" />
                                </div>
                                <span className="mt-5 block text-[11px] font-bold tracking-wider text-[#0a1c4a]/75 uppercase">
                                    INSTITUTIONAL GRADE
                                </span>
                                <h3 className="mt-2 text-xl font-bold text-[#0a1c4a]">Secure Investments</h3>
                                <p className="mt-2.5 text-xs sm:text-sm font-medium leading-relaxed text-[#0a1c4a]/90">
                                    Two-step sign-in, maker-checker approvals and a complete audit trail for every action.
                                </p>
                            </div>
                            <div className="mt-8 border-t border-black/10 pt-4">
                                <span className="inline-block rounded-md bg-black/10 px-3 py-1 text-xs font-semibold text-[#0a1c4a]">
                                    Maker-Checker Governance
                                </span>
                            </div>
                        </div>

                        {/* Card 3: Navy */}
                        <div className="flex flex-col justify-between rounded-2xl bg-[#0e224e] p-7 text-white shadow-xl">
                            <div>
                                <div className="flex size-11 items-center justify-center rounded-full bg-white/10 text-amber-300">
                                    <Clock3 className="size-5" />
                                </div>
                                <span className="mt-5 block text-[11px] font-bold tracking-wider text-amber-400 uppercase">
                                    INSTANT TELEMETRY
                                </span>
                                <h3 className="mt-2 text-xl font-bold text-white">Real Time Updates</h3>
                                <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-white/80">
                                    Live order book, instant bid confirmation and automatic notifications on every change.
                                </p>
                            </div>
                            <div className="mt-8 border-t border-white/10 pt-4">
                                <span className="inline-block rounded-md bg-white/10 px-3 py-1 text-xs text-white/90">
                                    Live order book syncing
                                </span>
                            </div>
                        </div>

                        {/* Card 4: Warm Gold */}
                        <div className="flex flex-col justify-between rounded-2xl bg-[#c59a4c] p-7 text-[#0a1c4a] shadow-xl">
                            <div>
                                <div className="flex size-11 items-center justify-center rounded-full bg-black/10 text-[#0a1c4a]">
                                    <Globe2 className="size-5" />
                                </div>
                                <span className="mt-5 block text-[11px] font-bold tracking-wider text-[#0a1c4a]/75 uppercase">
                                    MARKET INCLUSIVITY
                                </span>
                                <h3 className="mt-2 text-xl font-bold text-[#0a1c4a]">Broad Access</h3>
                                <p className="mt-2.5 text-xs sm:text-sm font-medium leading-relaxed text-[#0a1c4a]/90">
                                    Retail, QII and Non-QII investors subscribe to equities, fixed income and more online.
                                </p>
                            </div>
                            <div className="mt-8 border-t border-black/10 pt-4">
                                <span className="inline-block rounded-md bg-black/10 px-3 py-1 text-xs font-semibold text-[#0a1c4a]">
                                    Retail & QII enabled
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. THREE-STEP PROCESS SECTION */}
            <section id="offers" className="border-y border-slate-200/80 bg-slate-50 py-14 px-6 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
                        {/* Step 01 */}
                        <div className="flex items-start gap-4">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#0a1c4a] text-xs font-bold text-white shadow-xs">
                                01
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Create & Publish</h4>
                                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                                    Sponsors upload prospectuses, pricing parameters, and regulatory clearances directly through automated portal intake.
                                </p>
                            </div>
                        </div>

                        {/* Step 02 */}
                        <div className="flex items-start gap-4">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#0a1c4a] text-xs font-bold text-white shadow-xs">
                                02
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Book Building & Bids</h4>
                                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                                    Investors register bids with immediate validation, liquidity verification, and real-time allotment matching.
                                </p>
                            </div>
                        </div>

                        {/* Step 03 */}
                        <div className="flex items-start gap-4">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#0a1c4a] text-xs font-bold text-white shadow-xs">
                                03
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Depository Lodgement</h4>
                                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                                    Allotment schedules automatically integrate with CSCS and central depository accounts for zero-friction distribution.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. INSTITUTIONAL FOOTER */}
            <footer id="about" className="border-t border-slate-900 bg-[#071538] text-white pt-16 pb-10 px-6 sm:px-8 lg:px-12">
                <div className="mx-auto max-w-7xl">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                        {/* Column 1: Brand & Overview */}
                        <div className="lg:col-span-6">
                            <div className="flex items-center gap-3">
                                <img
                                    src={asset('images/fmdq-logo.svg')}
                                    alt="FMDQ"
                                    className="h-6 w-auto brightness-0 invert"
                                />
                                <div className="h-4 w-px bg-white/20" />
                                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                                    E-OFFERING PLATFORM
                                </span>
                            </div>
                            <p className="mt-4 max-w-md text-xs sm:text-sm leading-relaxed text-white/60">
                                FMDQ Group PLC is Africa's first vertically integrated financial market infrastructure (FMI)
                                group, driving debt capital, foreign exchange, derivatives, and public electronic offering solutions.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-white/70">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                                    <span>256-bit TLS Encrypted</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                                    <span>SEC Registered</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Regulatory Governance */}
                        <div id="regulations" className="lg:col-span-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                                Regulatory Governance
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-xs text-white/60">
                                <li>
                                    <a href="#" className="transition hover:text-white">
                                        Offering Rules & Guidelines
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="transition hover:text-white">
                                        Depository Operating Procedures
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="transition hover:text-white">
                                        Issuing House Accreditation
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="transition hover:text-white">
                                        Statutory Disclosures
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Column 3: Portal Assistance */}
                        <div id="sponsors" className="lg:col-span-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                                Portal Assistance
                            </h4>
                            <ul className="mt-4 space-y-2.5 text-xs text-white/60">
                                <li>
                                    <a href="#" className="transition hover:text-white">
                                        Help Desk & Ticketing
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="transition hover:text-white">
                                        Investor FAQs
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="transition hover:text-white">
                                        Data Privacy Policy
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="transition hover:text-white">
                                        Terms of Platform Access
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Disclaimer & Copyright */}
                    <div className="mt-14 border-t border-white/10 pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-white/50">
                        <p>Powered by iQx Consult Limited · &copy; {new Date().getFullYear()} FMDQ Group PLC. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <a href="#" className="transition hover:text-white">
                                Privacy Policy
                            </a>
                            <a href="#" className="transition hover:text-white">
                                Terms of Use
                            </a>
                            <a href="#" className="transition hover:text-white">
                                Security Architecture
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
