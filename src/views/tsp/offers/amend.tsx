import { Field, MoneyField, SelectField, TextField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Textarea } from '@/components/ui/textarea';
import { WizardSteps } from '@/components/wizard-steps';
import AppLayout from '@/layouts/app-layout';
import { confirmSubmit } from '@/lib/alert';
import { Head, Link, useForm } from '@/lib/app';
import { formatDate, formatDateTime, formatMoney, titleCase, toInputDateTime } from '@/lib/format';
import { amendableLabels } from '@/lib/labels';
import { type Offer } from '@/types';
import { AlertCircle, ArrowLeft, ArrowRight, Info, LoaderCircle, PencilLine, Send } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

/** The wizard's steps and the amendable fields on each (server errors arrive as "changes.<field>"). */
const STEPS = [
    { title: 'Dates', fields: ['open_at', 'close_at', 'maturity_date', 'allotment_date'] },
    { title: 'Size & Subscription', fields: ['offer_size', 'min_subscription_threshold', 'min_subscription_amount', 'subsequent_increment'] },
    { title: 'Price Discovery', fields: ['rate', 'rate_min', 'rate_max', 'implied_yield', 'issue_price', 'tenor', 'day_count_fraction'] },
    { title: 'Description & Payment', fields: ['issue_description', 'bank_name', 'bank_account_name', 'bank_account_number'] },
    { title: 'Reason & Review', fields: [] as string[] }
];
const LAST = STEPS.length - 1;
const MONEY = ['offer_size', 'min_subscription_amount', 'subsequent_increment', 'issue_price'];
const stepOf = (key: string) => {
    const field = key.replace(/^changes\./, '');
    if (field === 'close_at') return 0;
    const i = STEPS.findIndex((s) => s.fields.includes(field));
    return i === -1 ? LAST : i;
};
const label = (field: string) => titleCase(amendableLabels[field] ?? field);

/** How a value reads in the Current → New comparison. */
const display = (field: string, value: string) => {
    if (value === '' || value === null || value === undefined) return '—';
    if (field === 'open_at' || field === 'close_at') return formatDateTime(value);
    if (field === 'maturity_date' || field === 'allotment_date') return formatDate(value);
    if (MONEY.includes(field)) return formatMoney(value);
    if (['min_subscription_threshold', 'rate', 'rate_min', 'rate_max', 'implied_yield'].includes(field)) return `${value}%`;
    return value;
};

/**
 * CR s4.6 as a step-by-step wizard: change permitted details any time before allotment starts
 * (also after close), with a mandatory reason; goes through the same approval workflow and
 * notifies active bidders.
 */
export default function AmendOffer({ offer, dayCounts, activeBidders }: { offer: Offer; amendable: string[]; dayCounts: string[]; activeBidders: number }) {
    const initial: Record<string, string> = {
        open_at: toInputDateTime(offer.open_at),
        close_at: toInputDateTime(offer.close_at),
        offer_size: offer.offer_size ?? '',
        min_subscription_threshold: offer.min_subscription_threshold ?? '',
        min_subscription_amount: offer.min_subscription_amount ?? '',
        subsequent_increment: offer.subsequent_increment ?? '',
        rate: offer.rate ?? '',
        rate_min: offer.rate_min ?? '',
        rate_max: offer.rate_max ?? '',
        implied_yield: offer.implied_yield ?? '',
        issue_price: offer.issue_price ?? '',
        maturity_date: offer.maturity_date?.slice(0, 10) ?? '',
        allotment_date: offer.allotment_date?.slice(0, 10) ?? '',
        tenor: offer.tenor ?? '',
        day_count_fraction: offer.day_count_fraction ?? '',
        issue_description: offer.issue_description ?? '',
        bank_name: offer.bank_name ?? '',
        bank_account_name: offer.bank_account_name ?? '',
        bank_account_number: offer.bank_account_number ?? ''
    };
    const form = useForm<{ reason: string; changes: Record<string, string> }>({ reason: '', changes: { ...initial } });
    const errors = form.errors as Record<string, string>;
    const set = (k: string, v: string) => form.setData('changes', { ...form.data.changes, [k]: v });
    const changed = Object.keys(initial).filter((k) => String(form.data.changes[k] ?? '') !== String(initial[k] ?? ''));
    const changedOn = (i: number) => changed.filter((k) => STEPS[i].fields.includes(k)).length;
    const undo = (k: string) => set(k, initial[k]);

    // ── Wizard navigation: every field is pre-filled, so any step can be opened directly ─
    const [step, setStep] = useState(0);
    const top = useRef<HTMLDivElement>(null);
    const show = (i: number) => {
        setStep(i);
        top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // A refused submission opens the step that holds the first error.
    const errorKeys = Object.keys(errors).join('|');
    useEffect(() => {
        if (!errorKeys) return;
        const first = Math.min(...errorKeys.split('|').map(stepOf));
        if (first !== step) show(first);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errorKeys]);

    const send = async () => {
        if (changed.length === 0) {
            form.clearErrors();
            form.setError('changes', 'Change at least one detail before submitting the amendment.');
            return;
        }
        if (!form.data.reason.trim()) {
            form.clearErrors();
            form.setError('reason', 'Give the reason for the amendment.');
            return;
        }
        const confirmed = await confirmSubmit({
            title: 'Submit Amendment for Approval?',
            text: `${changed.length} change${changed.length === 1 ? '' : 's'} will go to your Authoriser. Investors with active bids are notified once the amendment is approved.`
        });
        if (!confirmed) return;
        const only: Record<string, string> = {};
        changed.forEach((k) => (only[k] = form.data.changes[k]));
        form.transform((d) => ({ ...d, changes: only }));
        form.post(route('tsp.offers.amendments.store', offer.id));
    };

    // Enter moves to the next step; submitting is always a deliberate click.
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (step < LAST) show(step + 1);
    };

    const errorList = Object.entries(errors);
    const numeric = (k: string, step = '0.0001') =>
        MONEY.includes(k) ? (
            <MoneyField key={k} label={label(k)} value={form.data.changes[k]} onChange={(v) => set(k, v)} error={errors[`changes.${k}`]} />
        ) : (
            <TextField key={k} label={label(k)} type="number" step={step} value={form.data.changes[k]} onChange={(v) => set(k, v)} error={errors[`changes.${k}`]} />
        );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offers', href: route('tsp.offers.index') },
                { title: offer.reference, href: route('tsp.offers.show', offer.id) },
                { title: 'Amend', href: route('tsp.offers.amend', offer.id) }
            ]}
        >
            <Head title={`Amend ${offer.reference}`} />
            <Page className="mx-auto w-full max-w-5xl">
                <div ref={top} className="scroll-mt-24" />
                <PageHeader title={`Amend ${offer.reference}`} description={offer.issuer_name} />

                <WizardSteps
                    steps={STEPS.map((s, i) => ({ title: s.title, badge: i < LAST && changedOn(i) > 0 ? `${changedOn(i)} changed` : undefined }))}
                    current={step}
                    reached={LAST}
                    errorSteps={new Set(errorList.map(([key]) => stepOf(key)))}
                    onSelect={show}
                />

                <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    <p>
                        Change only what you need; everything else stays as it is. Your Authoriser must approve the amendment. Once approved it applies immediately, the
                        original and amended values are kept in the audit trail and <strong>{activeBidders}</strong> investor{activeBidders === 1 ? '' : 's'} with active
                        bids will be notified.
                    </p>
                </div>

                {errorList.length > 0 && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 shadow-xs dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
                            <div className="flex-1 space-y-1.5">
                                <p className="font-semibold">Please correct the following:</p>
                                <ul className="list-disc space-y-1 pl-4 text-xs sm:text-sm">
                                    {errorList.map(([key, msg]) => (
                                        <li key={key}>
                                            <button type="button" className="text-left hover:underline" onClick={() => show(stepOf(key))}>
                                                <span className="font-semibold">{STEPS[stepOf(key)].title}:</span>{' '}
                                                {typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : String(msg)}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={submit} noValidate className="space-y-6">
                    {step === 0 && (
                        <Section className="[&_h2]:tracking-wide [&_h2]:uppercase" title="Dates" description="The offer window and the indicative maturity and allotment dates.">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label={label('open_at')} error={errors['changes.open_at']}>
                                    <DateTimePicker value={form.data.changes.open_at} onChange={(v) => set('open_at', v)} aria-invalid={!!errors['changes.open_at']} />
                                </Field>
                                <Field label={label('close_at')} error={errors['changes.close_at'] ?? errors.close_at}>
                                    <DateTimePicker
                                        value={form.data.changes.close_at}
                                        onChange={(v) => set('close_at', v)}
                                        min={form.data.changes.open_at || undefined}
                                        aria-invalid={!!(errors['changes.close_at'] ?? errors.close_at)}
                                    />
                                </Field>
                                <TextField
                                    label={label('maturity_date')}
                                    type="date"
                                    value={form.data.changes.maturity_date}
                                    onChange={(v) => set('maturity_date', v)}
                                    error={errors['changes.maturity_date']}
                                />
                                <TextField
                                    label={label('allotment_date')}
                                    type="date"
                                    value={form.data.changes.allotment_date}
                                    onChange={(v) => set('allotment_date', v)}
                                    error={errors['changes.allotment_date']}
                                />
                            </div>
                        </Section>
                    )}

                    {step === 1 && (
                        <Section className="[&_h2]:tracking-wide [&_h2]:uppercase" title="Size and Subscription" description="Offer size and subscription limits.">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {numeric('offer_size')}
                                {numeric('min_subscription_threshold', '0.01')}
                                {numeric('min_subscription_amount')}
                                {numeric('subsequent_increment')}
                            </div>
                        </Section>
                    )}

                    {step === 2 && (
                        <Section className="[&_h2]:tracking-wide [&_h2]:uppercase" title="Price Discovery" description="The parameters for this offer's price-discovery method.">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {offer.price_discovery_method === 'fixed_rate' && numeric('rate')}
                                {offer.price_discovery_method === 'book_building' && (
                                    <>
                                        {numeric('rate_min')}
                                        {numeric('rate_max')}
                                    </>
                                )}
                                {numeric('implied_yield')}
                                {numeric('issue_price')}
                                <TextField label={label('tenor')} value={form.data.changes.tenor} onChange={(v) => set('tenor', v)} error={errors['changes.tenor']} />
                                <SelectField
                                    label={label('day_count_fraction')}
                                    value={form.data.changes.day_count_fraction}
                                    onChange={(v) => set('day_count_fraction', v)}
                                    options={dayCounts.map((d) => ({ value: d, label: d }))}
                                    placeholder="—"
                                    error={errors['changes.day_count_fraction']}
                                />
                            </div>
                        </Section>
                    )}

                    {step === 3 && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="Description and Payment Account"
                            description="The issue description and the account investors pay into."
                        >
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label={label('issue_description')} className="sm:col-span-3" error={errors['changes.issue_description']}>
                                    <Textarea rows={2} value={form.data.changes.issue_description} onChange={(e) => set('issue_description', e.target.value)} />
                                </Field>
                                <TextField label={label('bank_name')} value={form.data.changes.bank_name} onChange={(v) => set('bank_name', v)} error={errors['changes.bank_name']} />
                                <TextField
                                    label={label('bank_account_name')}
                                    value={form.data.changes.bank_account_name}
                                    onChange={(v) => set('bank_account_name', v)}
                                    error={errors['changes.bank_account_name']}
                                />
                                <TextField
                                    label={label('bank_account_number')}
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={form.data.changes.bank_account_number}
                                    onChange={(v) => set('bank_account_number', v.replace(/\D/g, '').slice(0, 10))}
                                    error={errors['changes.bank_account_number']}
                                />
                            </div>
                        </Section>
                    )}

                    {step === LAST && (
                        <div className="space-y-4">
                            <Section
                                title="Changes"
                                description={changed.length ? `${changed.length} detail${changed.length === 1 ? '' : 's'} will change.` : 'Nothing has been changed yet.'}
                                flush={changed.length > 0}
                            >
                                {changed.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">Go back to a step and change the details you need to amend.</p>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                            <tr>
                                                <th className="px-4 py-2.5">Detail</th>
                                                <th className="px-4 py-2.5">Current</th>
                                                <th className="px-4 py-2.5">New</th>
                                                <th className="px-4 py-2.5" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {changed.map((k) => (
                                                <tr key={k} className="border-b last:border-0">
                                                    <td className="px-4 py-3 font-medium">{label(k)}</td>
                                                    <td className="text-muted-foreground px-4 py-3 line-through decoration-rose-400/70">{display(k, initial[k])}</td>
                                                    <td className="px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-400">{display(k, form.data.changes[k])}</td>
                                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => show(stepOf(k))}>
                                                            <PencilLine className="size-4" /> Edit
                                                        </Button>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => undo(k)}>
                                                            Undo
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </Section>
                            <Section className="[&_h2]:tracking-wide [&_h2]:uppercase" title="Reason for the Change">
                                <Field label="Reason" required error={errors.reason ?? errors.changes}>
                                    <Textarea
                                        rows={3}
                                        value={form.data.reason}
                                        onChange={(e) => form.setData('reason', e.target.value)}
                                        placeholder="Explain why the offer is being amended. Investors with active bids see this reason."
                                        aria-invalid={!!(errors.reason ?? errors.changes)}
                                    />
                                </Field>
                            </Section>
                        </div>
                    )}

                    <div className="bg-background/90 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t py-4 backdrop-blur">
                        <Button variant="ghost" asChild>
                            <Link href={route('tsp.offers.show', offer.id)}>Cancel</Link>
                        </Button>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground mr-1 hidden text-xs sm:inline">
                                Step {step + 1} of {STEPS.length}
                                {changed.length > 0 && ` · ${changed.length} change${changed.length === 1 ? '' : 's'}`}
                            </span>
                            {step > 0 && (
                                <Button type="button" variant="outline" onClick={() => show(step - 1)}>
                                    <ArrowLeft className="size-4" /> Back
                                </Button>
                            )}
                            {step < LAST ? (
                                <Button type="submit">
                                    Next <ArrowRight className="size-4" />
                                </Button>
                            ) : (
                                <Button type="button" disabled={form.processing || changed.length === 0} onClick={() => void send()}>
                                    {form.processing ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    Submit Amendment
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Page>
        </AppLayout>
    );
}
