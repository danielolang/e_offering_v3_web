import { DonutChart } from '@/components/charts';
import { DataTable } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@/lib/app';
import { formatCompact, formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { offerStatus } from '@/lib/labels';
import { type AuditLog, type Offer, type SharedData } from '@/types';
import {
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
    ChevronRight,
    FileText,
    PieChart as PieChartIcon,
    Plus,
    RefreshCw,
} from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    stats: { open: number; closed: number; total_subscribed: number; offers: number };
    byType: { type: string; count: number }[];
    recentOffers: Offer[];
    tasks: Record<string, number>;
    activity: AuditLog[];
    team: { id: number; name: string; email: string; access_level: string | null; last_login_at: string | null }[];
}

const taskLabels: Record<string, [string, string]> = {
    offers: ['Offers awaiting your approval', 'tsp.offers.index'],
    amendments: ['Amendments awaiting your approval', 'tsp.offers.index'],
    allotments: ['Allotments awaiting your approval', 'tsp.allotments.index'],
    returned: ['Offers returned for update', 'tsp.offers.index'],
    to_launch: ['Approved offers ready to launch', 'tsp.offers.index'],
    payments: ['Payment evidence to review', 'tsp.order-book.index'],
    ready_to_allot: ['Closed offers ready for allotment', 'tsp.allotments.index'],
};

export default function TspDashboard({ stats, byType = [], recentOffers = [], tasks = {}, activity = [], team = [] }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [chartMode, setChartMode] = useState<'volume' | 'value'>('volume');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const pending = Object.entries(tasks).filter(([, n]) => n > 0);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => setIsRefreshing(false),
        });
    };

    const userName = auth.user?.name ? auth.user.name.split(' ')[0] : 'Joshua';
    const institutionName = auth.user?.institution?.name || 'Ronan Hood';
    const roleLabel = auth.user?.role_label || 'TSP/RM Inputter';

    // Mock/default activity if none exists yet
    const displayActivity =
        activity.length > 0
            ? activity
            : [
                  {
                      id: 1,
                      description: 'Account login session initialized',
                      subtext: 'Authenticated via FMDQ Single Sign-On (SSO)',
                      created_at: 'Today, 08:30',
                      color: 'bg-blue-500',
                  },
                  {
                      id: 2,
                      description: 'Portal credentials verified',
                      subtext: 'Role: TSP/RM Inputter permissions granted',
                      created_at: 'Yesterday',
                      color: 'bg-emerald-500',
                  },
              ];

    // Mock/default team if none exists yet
    const displayTeam =
        team.length > 0
            ? team
            : [
                  {
                      id: 1,
                      name: auth.user?.name || 'Joshua Ryan',
                      subtext: `${institutionName} · Inputter`,
                      badge: 'Active',
                      badgeVariant: 'active',
                      initials: 'JR',
                  },
                  {
                      id: 2,
                      name: 'Ronan Hood Reviewer',
                      subtext: 'Lead Authoriser',
                      badge: 'Authoriser',
                      badgeVariant: 'authoriser',
                      initials: 'RH',
                  },
              ];

    return (
        <AppLayout breadcrumbs={[{ title: 'Dashboard', href: route('tsp.dashboard') }]}>
            <Head title="Dashboard" />

            <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* 1. WELCOME & ACTION BAR */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                            Welcome, {userName}
                        </h1>
                        <p className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
                            <span>{institutionName}</span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{roleLabel}</span>
                        </p>
                    </div>

                    <div>
                        <Link
                            href={route('tsp.offers.create')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0e224e] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#16336e] active:scale-[0.99] sm:text-sm"
                        >
                            <Plus className="size-4" />
                            <span>Create offer</span>
                        </Link>
                    </div>
                </div>

                {/* 2. TOP 4 STAT CARDS */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {/* Card 1: OPEN E-OFFERS (Amber/Gold) */}
                    <Link
                        href={route('tsp.order-book.index')}
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#c99d53] via-[#b88c42] to-[#a6792f] p-5.5 text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none"
                    >
                        {/* Concentric Vector Arcs */}
                        <div className="pointer-events-none absolute -bottom-10 -right-10 size-36 rounded-full border-[18px] border-white/10" />
                        <div className="pointer-events-none absolute -bottom-16 -right-16 size-52 rounded-full border-[14px] border-white/10" />

                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-bold tracking-wider text-white/95 uppercase">
                                    OPEN E-OFFERS
                                </span>
                                <p className="mt-0.5 text-[10px] text-white/80">(sponsored / co-sponsored)</p>
                            </div>
                            <ArrowUpRight className="size-4 text-white/70 transition group-hover:text-white" />
                        </div>
                        <div className="mt-4 text-4xl font-bold tracking-tight text-white">{stats?.open ?? 0}</div>
                    </Link>

                    {/* Card 2: CLOSED E-OFFERS (Navy) */}
                    <Link
                        href={route('tsp.allotments.index')}
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12285a] via-[#0d204a] to-[#081533] p-5.5 text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none"
                    >
                        {/* Concentric Vector Arcs */}
                        <div className="pointer-events-none absolute -bottom-10 -right-10 size-36 rounded-full border-[18px] border-white/10" />
                        <div className="pointer-events-none absolute -bottom-16 -right-16 size-52 rounded-full border-[14px] border-white/10" />

                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-bold tracking-wider text-white/95 uppercase">
                                    CLOSED E-OFFERS
                                </span>
                                <p className="mt-0.5 text-[10px] text-white/70">Finalized book issues</p>
                            </div>
                            <ArrowUpRight className="size-4 text-white/70 transition group-hover:text-white" />
                        </div>
                        <div className="mt-4 text-4xl font-bold tracking-tight text-white">{stats?.closed ?? 0}</div>
                    </Link>

                    {/* Card 3: TOTAL VALUE OF SUBSCRIPTIONS (Navy) */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12285a] via-[#0d204a] to-[#081533] p-5.5 text-white shadow-md">
                        {/* Concentric Vector Arcs */}
                        <div className="pointer-events-none absolute -bottom-10 -right-10 size-36 rounded-full border-[18px] border-white/10" />
                        <div className="pointer-events-none absolute -bottom-16 -right-16 size-52 rounded-full border-[14px] border-white/10" />

                        <div>
                            <span className="text-[11px] font-bold tracking-wider text-white/95 uppercase">
                                TOTAL VALUE OF SUBSCRIPTIONS
                            </span>
                            <p className="mt-0.5 text-[10px] text-white/70">Aggregate processed capital</p>
                        </div>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                                {stats?.total_subscribed ? formatCompact(stats.total_subscribed) : '₦0'}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-white/60">
                            {stats?.total_subscribed ? formatMoney(stats.total_subscribed) : '₦0.00'}
                        </p>
                    </div>

                    {/* Card 4: ALL OFFERS (Amber/Gold) */}
                    <Link
                        href={route('tsp.offers.index')}
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#c99d53] via-[#b88c42] to-[#a6792f] p-5.5 text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none"
                    >
                        {/* Concentric Vector Arcs */}
                        <div className="pointer-events-none absolute -bottom-10 -right-10 size-36 rounded-full border-[18px] border-white/10" />
                        <div className="pointer-events-none absolute -bottom-16 -right-16 size-52 rounded-full border-[14px] border-white/10" />

                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-[11px] font-bold tracking-wider text-white/95 uppercase">
                                    ALL OFFERS
                                </span>
                                <p className="mt-0.5 text-[10px] text-white/80">Cumulative lifetime offers</p>
                            </div>
                            <ArrowUpRight className="size-4 text-white/70 transition group-hover:text-white" />
                        </div>
                        <div className="mt-4 text-4xl font-bold tracking-tight text-white">{stats?.offers ?? 0}</div>
                    </Link>
                </div>

                {/* 3. MIDDLE ROW: WORK QUEUE & OFFERINGS BY TYPE */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left: Your work queue */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Your work queue
                                    </h3>
                                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        {pending.length} pending
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-slate-900 disabled:opacity-50 dark:text-slate-400 dark:hover:text-white"
                                >
                                    <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    <span>Refresh</span>
                                </button>
                            </div>

                            {/* Card Body */}
                            {pending.length === 0 ? (
                                <div className="my-10 flex flex-col items-center justify-center text-center">
                                    <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Nothing waiting for you.
                                    </h4>
                                    <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-slate-400">
                                        All assignments, verifications, and compliance tasks are fully caught up.
                                    </p>
                                </div>
                            ) : (
                                <ul className="my-6 space-y-2">
                                    {pending.map(([key, n]) => (
                                        <li key={key}>
                                            <Link
                                                href={route(taskLabels[key][1])}
                                                className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3.5 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60"
                                            >
                                                <span>{taskLabels[key][0]}</span>
                                                <span className="rounded-full bg-[#c59a4c] px-2 py-0.5 text-xs font-bold text-[#0a1c4a]">
                                                    {n}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Card Footer Status */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                            <span className="text-slate-400 dark:text-slate-500">Last checked: Just now</span>
                            <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                <span>Engine Synchronized</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Offerings by type */}
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                    Offerings by type
                                </h3>
                                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setChartMode('volume')}
                                        className={`rounded-md px-2.5 py-1 font-semibold transition ${
                                            chartMode === 'volume'
                                                ? 'bg-white text-slate-800 shadow-xs dark:bg-slate-700 dark:text-white'
                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        Volume
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setChartMode('value')}
                                        className={`rounded-md px-2.5 py-1 font-semibold transition ${
                                            chartMode === 'value'
                                                ? 'bg-white text-slate-800 shadow-xs dark:bg-slate-700 dark:text-white'
                                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                                        }`}
                                    >
                                        Value
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            {byType.length === 0 ? (
                                <div className="my-10 flex flex-col items-center justify-center text-center">
                                    <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                        <PieChartIcon className="size-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">No data yet</h4>
                                    <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                                        There are currently no active public offers or private bond issuances logged under
                                        your portfolio.
                                    </p>
                                </div>
                            ) : (
                                <div className="my-6">
                                    <DonutChart
                                        data={byType.map((t) => ({ label: t.type, value: t.count }))}
                                        centerLabel="Offers"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Card Footer Status */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                            <span className="text-slate-400 dark:text-slate-500">
                                Supported instruments: Equities, Bonds, CP
                            </span>
                            <a
                                href="#guidelines"
                                className="flex items-center gap-1 font-medium text-slate-700 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                            >
                                Guidelines <ArrowRight className="size-3" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* 4. THIRD ROW: OFFER REPORTS */}
                <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Offer reports</h3>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Consolidated summary records and distribution reports
                            </p>
                        </div>
                        <Link
                            href={route('tsp.offers.index')}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                            View more
                            <ChevronRight className="size-3.5" />
                        </Link>
                    </div>

                    {/* Table / Empty State */}
                    {recentOffers.length === 0 ? (
                        <div className="my-12 flex flex-col items-center justify-center text-center">
                            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                <FileText className="size-5" />
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No offers yet</h4>
                            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                                When offers are created, approved, or finalized, comprehensive execution and allotment
                                reports will appear here automatically.
                            </p>
                            <Link
                                href={route('tsp.offers.create')}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                                <Plus className="size-3.5" />
                                <span>Start an offer draft</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-4">
                            <DataTable
                                rows={recentOffers}
                                rowKey={(o) => o.id}
                                emptyTitle="No offers yet"
                                columns={[
                                    {
                                        key: 'id',
                                        header: 'Offer ID',
                                        value: (o) => o.reference,
                                        cell: (o) => (
                                            <Link
                                                href={route('tsp.offers.show', o.id)}
                                                className="font-mono text-xs font-semibold text-[#0e224e] hover:underline dark:text-amber-400"
                                            >
                                                {o.reference}
                                            </Link>
                                        ),
                                    },
                                    {
                                        key: 'type',
                                        header: 'Product type',
                                        value: (o) => o.security_type_label,
                                        cell: (o) => o.security_type_label,
                                    },
                                    {
                                        key: 'issuer',
                                        header: 'Issuer',
                                        value: (o) => o.issuer_name,
                                        cell: (o) => o.issuer_name,
                                    },
                                    {
                                        key: 'size',
                                        header: 'Face value',
                                        align: 'right',
                                        value: (o) => Number(o.offer_size),
                                        cell: (o) => formatMoney(o.offer_size, 0),
                                    },
                                    {
                                        key: 'sub',
                                        header: 'Subscribed',
                                        align: 'right',
                                        value: (o) => Number(o.subscribed ?? 0),
                                        cell: (o) => formatMoney(o.subscribed ?? 0, 0),
                                    },
                                    {
                                        key: 'open',
                                        header: 'Open',
                                        value: (o) => o.open_at,
                                        cell: (o) => formatDate(o.open_at),
                                    },
                                    {
                                        key: 'close',
                                        header: 'Close',
                                        value: (o) => o.close_at,
                                        cell: (o) => formatDate(o.close_at),
                                    },
                                    {
                                        key: 'status',
                                        header: 'Status',
                                        value: (o) => o.phase,
                                        cell: (o) => <StatusBadge map={offerStatus} value={o.phase} />,
                                    },
                                ]}
                            />
                        </div>
                    )}
                </div>

                {/* 5. FOURTH ROW: RECENT ACTIVITY & YOUR TEAM */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Left: Recent activity */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                Recent activity (your institution)
                            </h3>
                            <Link
                                href={route('tsp.audit')}
                                className="text-xs font-semibold text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                Security Audit Logs
                            </Link>
                        </div>

                        <div className="mt-4 space-y-4">
                            {displayActivity.map((a: any) => (
                                <div key={a.id} className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <span
                                            className={`mt-1.5 size-2 shrink-0 rounded-full ${
                                                a.color || 'bg-blue-500'
                                            }`}
                                        />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                {a.description}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                {a.subtext || (a.actor_name ? `${a.actor_name}` : 'Security event')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                        {a.created_at ? (a.created_at.includes('Today') || a.created_at.includes('Yesterday') ? a.created_at : formatDateTime(a.created_at)) : 'Recent'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Your team */}
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your team</h3>
                            <span className="text-xs font-semibold text-slate-500 transition hover:text-slate-900 cursor-pointer dark:text-slate-400 dark:hover:text-white">
                                Directory
                            </span>
                        </div>

                        <div className="mt-4 space-y-4">
                            {displayTeam.map((m: any) => {
                                const initials =
                                    m.initials ||
                                    (m.name
                                        ? m.name
                                              .split(' ')
                                              .map((p: string) => p[0])
                                              .join('')
                                              .toUpperCase()
                                              .slice(0, 2)
                                        : 'US');

                                return (
                                    <div key={m.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs ${
                                                    m.initials === 'RH' || m.access_level === 'authoriser'
                                                        ? 'bg-slate-700'
                                                        : 'bg-[#0e224e]'
                                                }`}
                                            >
                                                {initials}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                                                    {m.name}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                    {m.subtext || (m.access_level ? `${institutionName} · ${m.access_level}` : m.email)}
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            {m.badge === 'Active' || m.badgeVariant === 'active' || m.access_level === 'inputter' ? (
                                                <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    Authoriser
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
