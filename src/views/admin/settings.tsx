import { MoneyField, TextField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { confirmSubmit } from '@/lib/alert';
import { Head, useForm } from '@/lib/app';
import { cn } from '@/lib/utils';
import { TriangleAlert } from 'lucide-react';
import { FormEvent } from 'react';

type Settings = {
    fmdq_admin_review_enabled: boolean;
    fmdq_admin_review_security_types: string[];
    platform_fee_enabled: boolean;
    platform_fee_amount: number | string;
    platform_fee_bank_name: string;
    platform_fee_account_name: string;
    platform_fee_account_number: string;
};

/** On / off switch with its label and explanation. */
function SwitchRow({
    id,
    checked,
    onChange,
    label,
    description
}: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="min-w-0">
                <Label htmlFor={id} className="cursor-pointer">
                    {label}
                </Label>
                <p className="text-muted-foreground mt-1 text-sm">{description}</p>
            </div>
            <button
                id={id}
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={cn(
                    'focus-visible:ring-ring relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    checked ? 'bg-navy dark:bg-primary' : 'bg-input'
                )}
            >
                <span
                    className={cn(
                        'inline-block size-5 rounded-full bg-white shadow transition-transform',
                        checked ? 'translate-x-5.5' : 'translate-x-0.5'
                    )}
                />
            </button>
        </div>
    );
}

export default function AdminSettings({
    settings,
    securityTypes,
    pendingReview = {}
}: {
    settings: Settings;
    securityTypes: { value: string; label: string }[];
    /** Offers and amendments waiting for FMDQ Admin review, per security type. */
    pendingReview?: Record<string, number>;
}) {
    const form = useForm<Settings>({ ...settings, fmdq_admin_review_security_types: settings.fmdq_admin_review_security_types ?? [] });

    const toggleType = (type: string) =>
        form.setData(
            'fmdq_admin_review_security_types',
            form.data.fmdq_admin_review_security_types.includes(type)
                ? form.data.fmdq_admin_review_security_types.filter((t) => t !== type)
                : [...form.data.fmdq_admin_review_security_types, type]
        );

    // Mirrors Setting::adminReviewRequiredFor: no type selected means every type is reviewed.
    const reviewsAll = form.data.fmdq_admin_review_security_types.length === 0;
    const needsReview = (type: string) =>
        form.data.fmdq_admin_review_enabled && (reviewsAll || form.data.fmdq_admin_review_security_types.includes(type));
    // Waiting items whose review the new settings no longer require: saving releases them.
    const releasing = Object.entries(pendingReview).reduce((sum, [type, n]) => sum + (needsReview(type) ? 0 : n), 0);

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        const text =
            releasing > 0
                ? `The new settings apply to every user straight away. ${releasing} item(s) waiting for FMDQ review will be released to the TSP as approved.`
                : 'The new settings apply to every user straight away.';
        if (!(await confirmSubmit({ title: 'Save Platform Settings?', text, confirmText: 'Yes, Save' }))) return;
        form.put(route('admin.settings.update'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Settings', href: route('admin.settings') }]}>
            <Head title="Settings" />
            <Page>
                <PageHeader
                    title="Settings"
                    description="Platform switches from the Change Request. Every change is written to the audit trail."
                />
                <form onSubmit={submit} className="space-y-6">
                    <Section
                        className="[&_h2]:tracking-wide [&_h2]:uppercase"
                        title="FMDQ Admin offer review"
                        description="CR s4.4: an extra approval step after the TSP Authoriser, by security type. Disabled by default."
                        actions={
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                                    form.data.fmdq_admin_review_enabled
                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900'
                                        : 'bg-muted text-muted-foreground ring-border ring-1'
                                )}
                            >
                                <span
                                    className={cn(
                                        'size-1.5 rounded-full',
                                        form.data.fmdq_admin_review_enabled ? 'bg-emerald-500' : 'bg-muted-foreground/60'
                                    )}
                                />
                                {form.data.fmdq_admin_review_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        }
                    >
                        <div className="space-y-5">
                            <SwitchRow
                                id="review"
                                checked={form.data.fmdq_admin_review_enabled}
                                onChange={(v) => form.setData('fmdq_admin_review_enabled', v)}
                                label="Require FMDQ Admin review before launch"
                                description="When on, offers (and post-launch amendments) approved by the TSP Authoriser wait for an FMDQ Admin to approve or return them. When off, the TSP Authoriser's approval completes the workflow."
                            />

                            {form.data.fmdq_admin_review_enabled && (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-sm font-medium">Security types that need FMDQ review</p>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    form.setData(
                                                        'fmdq_admin_review_security_types',
                                                        securityTypes.map((t) => t.value)
                                                    )
                                                }
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => form.setData('fmdq_admin_review_security_types', [])}
                                            >
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="grid gap-2.5 sm:grid-cols-2">
                                        {securityTypes.map((t) => {
                                            const on = reviewsAll || form.data.fmdq_admin_review_security_types.includes(t.value);
                                            const waiting = pendingReview[t.value] ?? 0;
                                            return (
                                                <label
                                                    key={t.value}
                                                    className={cn(
                                                        'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition',
                                                        on
                                                            ? 'border-navy/40 bg-navy/[0.04] dark:border-primary/50 dark:bg-primary/10'
                                                            : 'hover:border-navy/30'
                                                    )}
                                                >
                                                    <Checkbox
                                                        checked={form.data.fmdq_admin_review_security_types.includes(t.value)}
                                                        onCheckedChange={() => toggleType(t.value)}
                                                    />
                                                    <span className="flex-1 font-medium">{t.label}</span>
                                                    {waiting > 0 && (
                                                        <span className="bg-gold/15 text-navy-dark rounded-full px-2 py-0.5 text-xs font-semibold dark:text-gold-light">
                                                            {waiting} waiting
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                        {reviewsAll
                                            ? 'No type selected, so every security type goes to FMDQ review.'
                                            : `${form.data.fmdq_admin_review_security_types.length} of ${securityTypes.length} security types go to FMDQ review; the rest are completed by the TSP Authoriser.`}
                                    </p>
                                </div>
                            )}

                            {releasing > 0 && (
                                <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                                    {releasing} item(s) waiting for FMDQ review will no longer need it. When you save, they are released to
                                    the TSP as approved.
                                </p>
                            )}
                        </div>
                    </Section>

                    <Section
                        className="[&_h2]:tracking-wide [&_h2]:uppercase"
                        title="Annual platform fee"
                        description="CR s3.2: a standalone yearly payment by each TSP/RM, not activated in the first year of launch."
                    >
                        <div className="space-y-4">
                            <SwitchRow
                                id="fee"
                                checked={form.data.platform_fee_enabled}
                                onChange={(v) => form.setData('platform_fee_enabled', v)}
                                label="Charge the annual platform fee"
                                description="When on, TSP/RMs pay after registration and are suspended if a renewal is not paid by the due date. TSP/RMs that registered while it was off keep access until their first renewal."
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <MoneyField
                                    label="Annual Fee"
                                    value={form.data.platform_fee_amount}
                                    onChange={(v) => form.setData('platform_fee_amount', v)}
                                    error={form.errors.platform_fee_amount}
                                />
                                <TextField
                                    label="Bank Name (Bank Transfer)"
                                    value={form.data.platform_fee_bank_name}
                                    onChange={(v) => form.setData('platform_fee_bank_name', v)}
                                    error={form.errors.platform_fee_bank_name}
                                />
                                <TextField
                                    label="Account Name"
                                    value={form.data.platform_fee_account_name}
                                    onChange={(v) => form.setData('platform_fee_account_name', v)}
                                    error={form.errors.platform_fee_account_name}
                                />
                                <TextField
                                    label="Account Number"
                                    value={form.data.platform_fee_account_number}
                                    onChange={(v) => form.setData('platform_fee_account_number', v)}
                                    error={form.errors.platform_fee_account_number}
                                />
                            </div>
                        </div>
                    </Section>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={form.processing}>
                            Save Settings
                        </Button>
                    </div>
                </form>
            </Page>
        </AppLayout>
    );
}
