import { Field, MoneyField, SelectField, TextField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { DocumentSlot, type SlotState } from '@/components/offers/document-slot';
import { PageHeader } from '@/components/page-header';
import { WizardSteps } from '@/components/wizard-steps';
import { DetailList, Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { confirmSubmit } from '@/lib/alert';
import { Head, Link, useForm } from '@/lib/app';
import { formatDate, formatDateTime, formatMoney, toInputDateTime, toPickerValue } from '@/lib/format';
import { postJson } from '@/lib/http';
import { cn } from '@/lib/utils';
import { type CoSponsor, type InvestorCategory, type Offer, type ReceivingAgent } from '@/types';
import { AlertCircle, ArrowLeft, ArrowRight, Check, Download, LoaderCircle, PencilLine, Plus, Save, Send, Trash2, Upload } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

interface SecurityType {
    label: string;
    universe: InvestorCategory[];
    has_tenor: boolean;
    documents: string[];
}

interface UploadedDocument {
    id: number;
    document_type: string;
    original_name: string;
    size: number;
}

interface Props {
    offer: (Offer & { receiving_agents: ReceivingAgent[]; co_sponsors: CoSponsor[] }) | null;
    documents?: UploadedDocument[];
    options: {
        issuerTypes: string[];
        securityTypes: Record<string, SecurityType>;
        methods: Record<string, string>;
        dayCounts: string[];
        categories: Record<InvestorCategory, string>;
    };
    sponsors: { id: number; name: string }[];
    defaults: { bank_name: string | null; bank_account_name: string | null; bank_account_number: string | null };
}

const rateLabel = (type: string) =>
    ({
        equities: 'Share price',
        depository_receipts: 'Share price',
        commercial_papers: 'Discount rate',
        non_interest: 'Rental / profit-sharing rate'
    })[type] ?? 'Coupon rate';

const dateOnly = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');
/** 'YYYY-MM-DD' of the next calendar day, built from parts so time zones cannot shift it. */
const dayAfter = (day: string | undefined) => {
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return undefined;
    const [y, m, d] = day.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
};
const num = (v: unknown) => (v === '' || v === null || v === undefined ? NaN : Number(String(v).replace(/,/g, '')));
const blank = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

/** The wizard's steps, and which fields (and server error keys) belong to each. */
const STEPS = [
    { title: 'Issuer & Security', fields: ['issuer_name', 'issuer_type', 'security_type', 'issue_description', 'issue_series'] },
    {
        title: 'Offer Terms',
        fields: ['offer_size', 'min_subscription_threshold', 'min_subscription_amount', 'subsequent_increment', 'open_at', 'close_at', 'tenor', 'day_count_fraction']
    },
    { title: 'Price Discovery', fields: ['price_discovery_method', 'rate', 'rate_min', 'rate_max', 'implied_yield', 'issue_price', 'maturity_date', 'allotment_date'] },
    { title: 'Investor Universe', fields: ['investor_universe'] },
    { title: 'Payment & Parties', fields: ['bank_name', 'bank_account_name', 'bank_account_number', 'uses_receiving_agents', 'receiving_agents', 'co_sponsors'] },
    { title: 'Documents', fields: ['new_documents', 'remove_documents', 'documents'] },
    { title: 'Review & Send', fields: [] as string[] }
];
const LAST = STEPS.length - 1;
const DOCUMENTS_STEP = 5;
const stepOf = (field: string) => {
    const i = STEPS.findIndex((s) => s.fields.some((f) => field === f || field.startsWith(f + '.')));
    return i === -1 ? LAST : i;
};

/** CR s4.1-4.3 as a step-by-step wizard: offer details, pricing, parties, documents, then review. */
export default function OfferForm({ offer, documents = [], options, sponsors, defaults }: Props) {
    const editing = offer !== null;
    const form = useForm({
        issuer_name: offer?.issuer_name ?? '',
        issue_description: offer?.issue_description ?? '',
        issue_series: offer?.issue_series ?? '',
        offer_size: offer?.offer_size ?? '',
        min_subscription_threshold: offer?.min_subscription_threshold ?? '50',
        issuer_type: offer?.issuer_type ?? '',
        security_type: offer?.security_type ?? '',
        open_at: toInputDateTime(offer?.open_at),
        close_at: toInputDateTime(offer?.close_at),
        min_subscription_amount: offer?.min_subscription_amount ?? '',
        subsequent_increment: offer?.subsequent_increment ?? '',
        tenor: offer?.tenor ?? '',
        day_count_fraction: offer?.day_count_fraction ?? '',
        price_discovery_method: offer?.price_discovery_method ?? '',
        investor_universe: (offer?.investor_universe ?? []) as InvestorCategory[],
        rate: offer?.rate ?? '',
        rate_min: offer?.rate_min ?? '',
        rate_max: offer?.rate_max ?? '',
        implied_yield: offer?.implied_yield ?? '',
        issue_price: offer?.issue_price ?? '',
        maturity_date: dateOnly(offer?.maturity_date),
        allotment_date: dateOnly(offer?.allotment_date),
        bank_name: offer?.bank_name ?? defaults.bank_name ?? '',
        bank_account_name: offer?.bank_account_name ?? defaults.bank_account_name ?? '',
        bank_account_number: offer?.bank_account_number ?? defaults.bank_account_number ?? '',
        uses_receiving_agents: offer?.uses_receiving_agents ?? false,
        receiving_agents: (offer?.receiving_agents ?? []).map((a) => ({
            name: a.name,
            bank_name: a.bank_name ?? '',
            bank_account_name: a.bank_account_name,
            bank_account_number: a.bank_account_number
        })),
        co_sponsors: (offer?.co_sponsors ?? []).map((c) => ({
            institution_id: c.institution_id,
            can_view_order_book: c.can_view_order_book,
            can_confirm_payments: c.can_confirm_payments,
            bank_name: c.bank_name ?? '',
            bank_account_name: c.bank_account_name ?? '',
            bank_account_number: c.bank_account_number ?? ''
        }))
    });
    const errors = form.errors as Record<string, string>;
    const closeDay = dateOnly(form.data.close_at) || undefined;
    const type = options.securityTypes[form.data.security_type];
    const method = form.data.price_discovery_method;
    const fileRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [importErrors, setImportErrors] = useState<string[]>([]);

    const chooseType = (key: string) => {
        const secType = options.securityTypes[key];
        const allowed = secType?.universe ?? [];
        const hasTenor = secType?.has_tenor ?? false;
        form.setData((d) => ({
            ...d,
            security_type: key,
            investor_universe: d.investor_universe.length ? d.investor_universe.filter((u) => allowed.includes(u)) : allowed,
            tenor: hasTenor ? d.tenor : '',
            maturity_date: hasTenor ? d.maturity_date : '',
            day_count_fraction: hasTenor ? d.day_count_fraction : ''
        }));
    };

    const toggleUniverse = (c: InvestorCategory) =>
        form.setData(
            'investor_universe',
            form.data.investor_universe.includes(c) ? form.data.investor_universe.filter((x) => x !== c) : [...form.data.investor_universe, c]
        );

    const setAgent = (i: number, patch: Partial<(typeof form.data.receiving_agents)[number]>) =>
        form.setData(
            'receiving_agents',
            form.data.receiving_agents.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
        );
    const setCo = (i: number, patch: Partial<(typeof form.data.co_sponsors)[number]>) =>
        form.setData(
            'co_sponsors',
            form.data.co_sponsors.map((c, idx) => (idx === i ? { ...c, ...patch } : c))
        );

    const importAgents = async (file: File) => {
        setImporting(true);
        setImportErrors([]);
        try {
            const body = new FormData();
            body.append('file', file);
            const res = await postJson<{
                rows: { name: string; bank_name: string; bank_account_name: string; bank_account_number: string }[];
                errors: string[];
            }>(route('tsp.offers.agents-import'), body);
            form.setData((d) => ({ ...d, uses_receiving_agents: true, receiving_agents: [...d.receiving_agents, ...res.rows] }));
            setImportErrors(res.errors);
        } catch (e) {
            setImportErrors([e instanceof Error ? e.message : 'The file could not be read.']);
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    // ── Wizard navigation ──────────────────────────────────────────────────────────────
    const [step, setStep] = useState(0);
    // Editing an existing offer: every step was filled before, so all can be opened directly.
    const [reached, setReached] = useState(editing ? LAST : 0);
    const top = useRef<HTMLDivElement>(null);
    const show = (i: number) => {
        setStep(i);
        setReached((r) => Math.max(r, i));
        top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /** Client-side checks for one step, mirroring the API's OfferRequest rules. */
    const checkStep = (i: number): Record<string, string> => {
        const d = form.data;
        const e: Record<string, string> = {};
        const hasTenor = type?.has_tenor ?? true;
        if (i === 0) {
            if (blank(d.issuer_name)) e.issuer_name = "Enter the issuer's registered name.";
            if (blank(d.issuer_type)) e.issuer_type = 'Select the issuer type.';
            if (blank(d.security_type)) e.security_type = 'Select the security type.';
            if (blank(d.issue_description)) e.issue_description = 'Describe the issue.';
        }
        if (i === 1) {
            if (!(num(d.offer_size) > 0)) e.offer_size = 'Enter the offer size.';
            const threshold = num(d.min_subscription_threshold);
            if (!(threshold >= 0 && threshold <= 100)) e.min_subscription_threshold = 'Enter a threshold between 0 and 100%.';
            if (!(num(d.min_subscription_amount) > 0)) e.min_subscription_amount = 'Enter the minimum subscription amount.';
            if (!(num(d.subsequent_increment) >= 0)) e.subsequent_increment = 'Enter the subsequent increment (0 for any amount).';
            if (blank(d.open_at)) e.open_at = 'Pick the proposed open date.';
            if (blank(d.close_at)) e.close_at = 'Pick the proposed close date.';
            else if (!blank(d.open_at) && d.close_at <= d.open_at) e.close_at = 'The close date must be after the open date.';
            if (hasTenor && blank(d.tenor)) e.tenor = 'Enter the tenor, e.g. 270 days.';
        }
        if (i === 2) {
            if (blank(d.price_discovery_method)) e.price_discovery_method = 'Select the price-discovery method.';
            if (d.price_discovery_method === 'fixed_rate' && !(num(d.rate) > 0)) e.rate = `Enter the ${rateLabel(d.security_type).toLowerCase()}.`;
            if (d.price_discovery_method === 'book_building') {
                if (!(num(d.rate_min) > 0)) e.rate_min = 'Enter the minimum of the range.';
                if (!(num(d.rate_max) > 0)) e.rate_max = 'Enter the maximum of the range.';
                else if (num(d.rate_max) < num(d.rate_min)) e.rate_max = 'The maximum must not be below the minimum.';
            }
            if (!(num(d.implied_yield) >= 0)) e.implied_yield = 'Enter the implied yield.';
            if (!(num(d.issue_price) > 0)) e.issue_price = 'Enter the issue price per unit.';
            if (hasTenor && blank(d.maturity_date)) e.maturity_date = 'Pick the indicative maturity date.';
            else if (hasTenor && closeDay && d.maturity_date <= closeDay) e.maturity_date = 'The maturity date must be after the offer close date.';
            if (blank(d.allotment_date)) e.allotment_date = 'Pick the indicative allotment date.';
            else if (closeDay && d.allotment_date < closeDay) e.allotment_date = 'The allotment date must be on or after the offer close date.';
        }
        if (i === 3 && d.investor_universe.length === 0) e.investor_universe = 'Select at least one investor category.';
        if (i === 4) {
            if (blank(d.bank_name)) e.bank_name = 'Enter the bank name.';
            if (blank(d.bank_account_name)) e.bank_account_name = 'Enter the account name.';
            if (!/^\d{10}$/.test(String(d.bank_account_number))) e.bank_account_number = 'Enter the 10-digit account number.';
            if (d.uses_receiving_agents && d.receiving_agents.length === 0) e.receiving_agents = 'Add at least one receiving agent, or switch receiving agents off.';
            if (d.uses_receiving_agents)
                d.receiving_agents.forEach((a, idx) => {
                    if (blank(a.name)) e[`receiving_agents.${idx}.name`] = 'Enter the agent name.';
                    else if (blank(a.bank_account_name)) e[`receiving_agents.${idx}.bank_account_name`] = 'Enter the agent account name.';
                    else if (!/^\d{10}$/.test(a.bank_account_number)) e[`receiving_agents.${idx}.bank_account_number`] = 'Enter the 10-digit agent account number.';
                });
            d.co_sponsors.forEach((c, idx) => {
                if (!c.institution_id) e[`co_sponsors.${idx}.institution_id`] = 'Select the co-sponsor.';
            });
        }
        return e;
    };

    const flag = (found: Record<string, string>) => {
        form.clearErrors();
        Object.entries(found).forEach(([field, message]) => form.setError(field, message));
    };

    const next = () => {
        const found = checkStep(step);
        if (Object.keys(found).length) return flag(found);
        form.clearErrors();
        show(step + 1);
    };

    /** Opening a later step from the step bar checks the steps in between first. */
    const goTo = (target: number) => {
        if (target > reached) return;
        for (let i = step; i < target; i++) {
            const found = checkStep(i);
            if (Object.keys(found).length) {
                show(i);
                return flag(found);
            }
        }
        show(target);
    };

    // A save the server refused opens the step that holds the first error.
    const errorKeys = Object.keys(errors).join('|');
    useEffect(() => {
        if (!errorKeys) return;
        const first = Math.min(...errorKeys.split('|').map(stepOf));
        if (first !== step) show(first);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errorKeys]);

    // ── Supporting documents (saved with the offer in one request) ───────────────────
    const required = type?.documents ?? [];
    const [pending, setPending] = useState<Record<string, File>>({});
    const [removed, setRemoved] = useState<number[]>([]);
    const uploadedOf = (docType: string) => documents.find((doc) => doc.document_type === docType && !removed.includes(doc.id));
    const slot = (docType: string): SlotState => {
        if (pending[docType]) return { kind: 'pending', file: pending[docType] };
        const uploaded = uploadedOf(docType);
        return uploaded ? { kind: 'uploaded', name: uploaded.original_name, size: uploaded.size } : { kind: 'empty' };
    };
    const pick = (docType: string, file: File) => setPending((p) => ({ ...p, [docType]: file }));
    const removeDoc = (docType: string) => {
        if (pending[docType]) {
            setPending((p) => Object.fromEntries(Object.entries(p).filter(([key]) => key !== docType)));
            return;
        }
        const uploaded = uploadedOf(docType);
        if (uploaded) setRemoved((r) => [...r, uploaded.id]);
    };
    const missingDocs = required.filter((docType) => slot(docType).kind === 'empty');

    // ── Saving ───────────────────────────────────────────────────────────────────────
    /** "Save Draft" keeps it as a draft; "Send for Approval" also submits it to the Authoriser. */
    const save = async (send: boolean) => {
        // The API needs every detail even for a draft, so an incomplete step is opened first.
        for (let i = 0; i < DOCUMENTS_STEP; i++) {
            const found = checkStep(i);
            if (Object.keys(found).length) {
                show(i);
                return flag(found);
            }
        }
        const name = form.data.issuer_name.trim() || 'this offer';
        const sending = send && missingDocs.length === 0;
        const confirmed = await confirmSubmit(
            send
                ? {
                    title: sending ? 'Send for Approval?' : 'Documents Missing',
                    text: sending
                        ? `${name} and its ${required.length} supporting document(s) will be saved and sent to your Authoriser for approval.`
                        : `${missingDocs.join(', ')} ${missingDocs.length > 1 ? 'are' : 'is'} still missing, so ${name} will be saved as a draft. Add the missing document(s), then send it for approval.`,
                    confirmText: sending ? 'Yes, Send' : 'Save as Draft'
                }
                : { title: 'Save Draft?', text: `${name} will be saved as a draft for you to complete and send for approval.`, confirmText: 'Yes, Save' }
        );
        if (!confirmed) return;
        form.transform((values) => ({
            ...values,
            submit_after_save: sending,
            new_documents: required.filter((docType) => pending[docType]).map((docType) => ({ type: docType, file: pending[docType] })),
            // Removed by the user, or left over from a security type that is no longer selected.
            remove_documents: [...removed, ...documents.filter((doc) => !required.includes(doc.document_type)).map((doc) => doc.id)]
        }));
        if (editing) form.put(route('tsp.offers.update', offer!.id));
        else form.post(route('tsp.offers.store'));
    };

    // Enter moves to the next step; saving and sending are always deliberate clicks.
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (step < LAST) next();
    };

    const errorList = Object.entries(errors);
    const editStep = (i: number) => (
        <Button type="button" variant="ghost" size="sm" onClick={() => show(i)}>
            <PencilLine className="size-4" /> Edit
        </Button>
    );
    const sponsorName = (id: number) => sponsors.find((s) => s.id === id)?.name ?? '—';
    const rateSummary =
        method === 'fixed_rate'
            ? `${form.data.rate}%`
            : method === 'book_building'
                ? `${form.data.rate_min}% – ${form.data.rate_max}%`
                : method === 'competitive'
                    ? 'Set at allotment'
                    : '—';

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offers', href: route('tsp.offers.index') },
                editing ? { title: offer!.reference, href: route('tsp.offers.show', offer!.id) } : { title: 'Create Offer', href: route('tsp.offers.create') }
            ]}
        >
            <Head title={editing ? 'Edit Offer' : 'Create Offer'} />
            <Page className="mx-auto w-full max-w-5xl">
                <div ref={top} className="scroll-mt-24" />
                <PageHeader
                    title={editing ? `Edit ${offer!.reference}` : 'Create Offer'}
                    description="Complete each step, attach the supporting documents, then send the offer to your Authoriser for approval."
                />

                {/* Step bar: completed steps can be reopened; later ones open as you go. */}
                <WizardSteps
                    steps={STEPS.map((s, i) => ({
                        title: s.title,
                        badge: i === DOCUMENTS_STEP && required.length > 0 ? `${required.length - missingDocs.length}/${required.length}` : undefined
                    }))}
                    current={step}
                    reached={reached}
                    errorSteps={new Set(errorList.map(([field]) => stepOf(field)))}
                    onSelect={goTo}
                />

                {errorList.length > 0 && (
                    <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 shadow-xs dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-200">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
                            <div className="flex-1 space-y-1.5">
                                <p className="font-semibold">
                                    Please correct the {errorList.length} error{errorList.length > 1 ? 's' : ''} below:
                                </p>
                                <ul className="list-disc space-y-1 pl-4 text-xs sm:text-sm">
                                    {errorList.map(([field, msg]) => (
                                        <li key={field}>
                                            <button type="button" className="text-left hover:underline" onClick={() => show(stepOf(field))}>
                                                <span className="font-semibold">{STEPS[stepOf(field)].title}:</span>{' '}
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
                        <Section className="[&_h2]:tracking-wide [&_h2]:uppercase" title="Issuer and Security" description="Who is issuing, and what is being offered.">
                            <div className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextField
                                        label="Issuer's Registered Name"
                                        required
                                        value={form.data.issuer_name}
                                        onChange={(v) => form.setData('issuer_name', v)}
                                        error={errors.issuer_name}
                                    />
                                    <SelectField
                                        label="Issuer Type"
                                        required
                                        value={form.data.issuer_type}
                                        onChange={(v) => form.setData('issuer_type', v)}
                                        options={options.issuerTypes.map((t) => ({ value: t, label: t }))}
                                        error={errors.issuer_type}
                                    />
                                </div>
                                <Field label="Security Type" required error={errors.security_type}>
                                    <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                                        {Object.entries(options.securityTypes).map(([key, t]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                role="radio"
                                                aria-checked={form.data.security_type === key}
                                                onClick={() => chooseType(key)}
                                                className={cn(
                                                    'rounded-lg border px-3 py-2.5 text-left text-sm transition',
                                                    form.data.security_type === key ? 'border-navy bg-navy/5 text-navy font-medium dark:text-white' : 'hover:border-navy/40'
                                                )}
                                            >
                                                {t.label}
                                                {key === 'depository_receipts' && <span className="text-gold ml-1 text-xs">New</span>}
                                                <span className="text-muted-foreground mt-0.5 block text-xs font-normal">{t.documents.length} supporting document(s)</span>
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                                    <Field label="Issue Description" required error={errors.issue_description}>
                                        <Textarea rows={2} value={form.data.issue_description} onChange={(e) => form.setData('issue_description', e.target.value)} />
                                    </Field>
                                    <TextField
                                        label="Issue Series"
                                        value={form.data.issue_series}
                                        onChange={(v) => form.setData('issue_series', v)}
                                        error={errors.issue_series}
                                    />
                                </div>
                            </div>
                        </Section>
                    )}

                    {step === 1 && (
                        <Section className="[&_h2]:tracking-wide [&_h2]:uppercase" title="Offer Terms" description="Size, subscription limits and the offer window.">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <MoneyField
                                    label="Offer Size"
                                    prefix="Up to ₦"
                                    required
                                    value={form.data.offer_size}
                                    onChange={(v) => form.setData('offer_size', v)}
                                    error={errors.offer_size}
                                />
                                <TextField
                                    label="Minimum Subscription Threshold (%)"
                                    type="number"
                                    min={0}
                                    max={100}
                                    step="0.01"
                                    required
                                    value={form.data.min_subscription_threshold}
                                    onChange={(v) => form.setData('min_subscription_threshold', v)}
                                    error={errors.min_subscription_threshold}
                                    hint="Below this subscription level you may cancel the offer at allotment."
                                />
                                <MoneyField
                                    label="Minimum Subscription Amount"
                                    required
                                    value={form.data.min_subscription_amount}
                                    onChange={(v) => form.setData('min_subscription_amount', v)}
                                    error={errors.min_subscription_amount}
                                />
                                <MoneyField
                                    label="Subsequent Increments"
                                    required
                                    value={form.data.subsequent_increment}
                                    onChange={(v) => form.setData('subsequent_increment', v)}
                                    error={errors.subsequent_increment}
                                    hint="Use 0 for any amount above the minimum."
                                />
                                <Field label="Proposed Offer Open Date" required error={errors.open_at}>
                                    <DateTimePicker
                                        value={form.data.open_at}
                                        onChange={(v) => form.setData('open_at', v)}
                                        min={editing ? undefined : toPickerValue(new Date())}
                                        aria-invalid={!!errors.open_at}
                                    />
                                </Field>
                                <Field label="Proposed Offer Close Date" required error={errors.close_at}>
                                    <DateTimePicker
                                        value={form.data.close_at}
                                        onChange={(v) => form.setData('close_at', v)}
                                        min={form.data.open_at || undefined}
                                        aria-invalid={!!errors.close_at}
                                    />
                                </Field>
                                {(type?.has_tenor ?? true) ? (
                                    <TextField
                                        label="Tenor"
                                        required
                                        value={form.data.tenor}
                                        onChange={(v) => form.setData('tenor', v)}
                                        error={errors.tenor}
                                        placeholder="e.g. 270 days, 5 years"
                                    />
                                ) : (
                                    <Field label="Tenor">
                                        <p className="text-muted-foreground py-2 text-sm">Not applicable for {type?.label}.</p>
                                    </Field>
                                )}
                                <SelectField
                                    label="Day Count Fraction"
                                    value={form.data.day_count_fraction}
                                    onChange={(v) => form.setData('day_count_fraction', v)}
                                    options={options.dayCounts.map((d) => ({ value: d, label: d }))}
                                    placeholder="Optional"
                                    error={errors.day_count_fraction}
                                />
                            </div>
                        </Section>
                    )}

                    {step === 2 && (
                        <Section className="[&_h2]:tracking-wide [&_h2]:uppercase" title="Price Discovery" description="Fields differ slightly by method (CR s4.3).">
                            <div className="space-y-4">
                                <Field label="Price-Discovery Method" required error={errors.price_discovery_method}>
                                    <div className="grid gap-2 sm:grid-cols-3" role="radiogroup">
                                        {Object.entries(options.methods).map(([key, label]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                role="radio"
                                                aria-checked={method === key}
                                                onClick={() => form.setData('price_discovery_method', key as Offer['price_discovery_method'])}
                                                className={cn(
                                                    'rounded-lg border px-3 py-2.5 text-left text-sm transition',
                                                    method === key ? 'border-navy bg-navy/5 text-navy font-medium dark:text-white' : 'hover:border-navy/40'
                                                )}
                                            >
                                                {label}
                                                {key === 'book_building' && <span className="text-gold ml-1 text-xs">New</span>}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {method === 'fixed_rate' && (
                                        <TextField
                                            label={rateLabel(form.data.security_type)}
                                            type="number"
                                            step="0.0001"
                                            required
                                            value={form.data.rate}
                                            onChange={(v) => form.setData('rate', v)}
                                            error={errors.rate}
                                        />
                                    )}
                                    {method === 'competitive' && (
                                        <Field label={rateLabel(form.data.security_type)}>
                                            <p className="text-muted-foreground py-2 text-sm">
                                                Not captured now; investors bid their rates and you enter the final rate at allotment.
                                            </p>
                                        </Field>
                                    )}
                                    {method === 'book_building' && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <TextField
                                                label={`${rateLabel(form.data.security_type)} – Minimum`}
                                                type="number"
                                                step="0.0001"
                                                required
                                                value={form.data.rate_min}
                                                onChange={(v) => form.setData('rate_min', v)}
                                                error={errors.rate_min}
                                            />
                                            <TextField
                                                label="Maximum"
                                                type="number"
                                                step="0.0001"
                                                required
                                                value={form.data.rate_max}
                                                onChange={(v) => form.setData('rate_max', v)}
                                                error={errors.rate_max}
                                            />
                                        </div>
                                    )}
                                    <TextField
                                        label="Implied Yield (%)"
                                        type="number"
                                        step="0.0001"
                                        required
                                        value={form.data.implied_yield}
                                        onChange={(v) => form.setData('implied_yield', v)}
                                        error={errors.implied_yield}
                                    />
                                    <MoneyField
                                        label="Issue Price per Unit"
                                        required
                                        value={form.data.issue_price}
                                        onChange={(v) => form.setData('issue_price', v)}
                                        error={errors.issue_price}
                                    />
                                    {((type?.has_tenor ?? true) || Boolean(errors.maturity_date)) && (
                                        <TextField
                                            label="Indicative Maturity Date"
                                            type="date"
                                            required={type?.has_tenor ?? true}
                                            min={dayAfter(closeDay)}
                                            value={form.data.maturity_date}
                                            onChange={(v) => form.setData('maturity_date', v)}
                                            error={errors.maturity_date}
                                            hint={closeDay ? 'Must be after the offer close date.' : undefined}
                                        />
                                    )}
                                    <TextField
                                        label="Indicative Allotment Date"
                                        type="date"
                                        required
                                        min={closeDay}
                                        value={form.data.allotment_date}
                                        onChange={(v) => form.setData('allotment_date', v)}
                                        error={errors.allotment_date}
                                        hint={closeDay ? 'On or after the offer close date.' : undefined}
                                    />
                                </div>
                            </div>
                        </Section>
                    )}

                    {step === 3 && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="Investor Universe"
                            description={type ? `Who may bid. Pre-filtered for ${type.label}.` : 'Choose a security type first.'}
                        >
                            <div className="grid gap-2.5 sm:grid-cols-2">
                                {(type?.universe ?? []).map((c) => (
                                    <label
                                        key={c}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition',
                                            form.data.investor_universe.includes(c) ? 'border-navy bg-navy/5 dark:border-primary dark:bg-primary/10' : 'hover:border-navy/30'
                                        )}
                                    >
                                        <Checkbox checked={form.data.investor_universe.includes(c)} onCheckedChange={() => toggleUniverse(c)} />
                                        {options.categories[c]}
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.investor_universe ?? errors['investor_universe.0']} className="mt-2" />
                        </Section>
                    )}

                    {step === 4 && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="Payment, Receiving Agents and Co-Sponsors"
                            description="Investors pay the receiving agent or co-sponsor they choose, or the main sponsor account below."
                        >
                            <div className="space-y-6">
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <TextField
                                        label="Bank Name"
                                        required
                                        value={form.data.bank_name}
                                        onChange={(v) => form.setData('bank_name', v)}
                                        error={errors.bank_name}
                                    />
                                    <TextField
                                        label="Account Name"
                                        required
                                        value={form.data.bank_account_name}
                                        onChange={(v) => form.setData('bank_account_name', v)}
                                        error={errors.bank_account_name}
                                    />
                                    <TextField
                                        label="Account Number"
                                        required
                                        inputMode="numeric"
                                        maxLength={10}
                                        value={form.data.bank_account_number}
                                        onChange={(v) => form.setData('bank_account_number', v.replace(/\D/g, ''))}
                                        error={errors.bank_account_number}
                                    />
                                </div>

                                <div className="rounded-lg border p-4">
                                    <label className="flex items-center gap-2 text-sm font-medium">
                                        <Checkbox
                                            checked={form.data.uses_receiving_agents}
                                            onCheckedChange={(v) => form.setData('uses_receiving_agents', v === true)}
                                        />
                                        This offer uses receiving agents
                                    </label>
                                    {form.data.uses_receiving_agents && (
                                        <div className="mt-4 space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Button type="button" variant="outline" size="sm" asChild>
                                                    <a href={route('tsp.offers.agents-template')}>
                                                        <Download className="size-4" /> Excel Template
                                                    </a>
                                                </Button>
                                                <Button type="button" variant="outline" size="sm" disabled={importing} onClick={() => fileRef.current?.click()}>
                                                    {importing ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />} Import from Excel
                                                </Button>
                                                <input
                                                    ref={fileRef}
                                                    type="file"
                                                    accept=".xlsx,.xls,.csv"
                                                    className="sr-only"
                                                    onChange={(e) => e.target.files?.[0] && importAgents(e.target.files[0])}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        form.setData('receiving_agents', [
                                                            ...form.data.receiving_agents,
                                                            { name: '', bank_name: '', bank_account_name: '', bank_account_number: '' }
                                                        ])
                                                    }
                                                >
                                                    <Plus className="size-4" /> Add Agent
                                                </Button>
                                            </div>
                                            {importErrors.length > 0 && (
                                                <ul className="rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                                    {importErrors.map((e) => (
                                                        <li key={e}>{e}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {form.data.receiving_agents.map((a, i) => (
                                                <div key={i} className="grid gap-2 sm:grid-cols-[1.3fr_1fr_1.3fr_0.9fr_auto]">
                                                    <Input placeholder="Agent name" value={a.name} onChange={(e) => setAgent(i, { name: e.target.value })} aria-label="Agent name" />
                                                    <Input placeholder="Bank" value={a.bank_name} onChange={(e) => setAgent(i, { bank_name: e.target.value })} aria-label="Bank" />
                                                    <Input
                                                        placeholder="Account name"
                                                        value={a.bank_account_name}
                                                        onChange={(e) => setAgent(i, { bank_account_name: e.target.value })}
                                                        aria-label="Account name"
                                                    />
                                                    <Input
                                                        placeholder="Account no."
                                                        inputMode="numeric"
                                                        maxLength={10}
                                                        value={a.bank_account_number}
                                                        onChange={(e) => setAgent(i, { bank_account_number: e.target.value.replace(/\D/g, '') })}
                                                        aria-label="Account number"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Remove agent"
                                                        onClick={() =>
                                                            form.setData(
                                                                'receiving_agents',
                                                                form.data.receiving_agents.filter((_, idx) => idx !== i)
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                    {(errors[`receiving_agents.${i}.name`] ||
                                                        errors[`receiving_agents.${i}.bank_account_number`] ||
                                                        errors[`receiving_agents.${i}.bank_account_name`]) && (
                                                            <InputError
                                                                className="sm:col-span-5"
                                                                message={
                                                                    errors[`receiving_agents.${i}.name`] ??
                                                                    errors[`receiving_agents.${i}.bank_account_name`] ??
                                                                    errors[`receiving_agents.${i}.bank_account_number`]
                                                                }
                                                            />
                                                        )}
                                                </div>
                                            ))}
                                            <InputError message={errors.receiving_agents} />
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">Co-sponsors and their access</p>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={sponsors.length === 0}
                                            onClick={() =>
                                                form.setData('co_sponsors', [
                                                    ...form.data.co_sponsors,
                                                    {
                                                        institution_id: 0,
                                                        can_view_order_book: true,
                                                        can_confirm_payments: false,
                                                        bank_name: '',
                                                        bank_account_name: '',
                                                        bank_account_number: ''
                                                    }
                                                ])
                                            }
                                        >
                                            <Plus className="size-4" /> Add Co-Sponsor
                                        </Button>
                                    </div>
                                    {form.data.co_sponsors.length === 0 && <p className="text-muted-foreground mt-2 text-sm">No co-sponsors.</p>}
                                    <div className="mt-3 space-y-3">
                                        {form.data.co_sponsors.map((c, i) => (
                                            <div key={i} className="space-y-2 rounded-md border p-3">
                                                <div className="flex gap-2">
                                                    <select
                                                        value={c.institution_id || ''}
                                                        onChange={(e) => setCo(i, { institution_id: Number(e.target.value) })}
                                                        aria-label="Co-sponsor"
                                                        className="border-input bg-background h-9 flex-1 rounded-md border px-2 text-sm"
                                                    >
                                                        <option value="">Select a TSP/RM…</option>
                                                        {sponsors.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Remove co-sponsor"
                                                        onClick={() =>
                                                            form.setData(
                                                                'co_sponsors',
                                                                form.data.co_sponsors.filter((_, idx) => idx !== i)
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                                <InputError message={errors[`co_sponsors.${i}.institution_id`]} />
                                                <div className="flex flex-wrap gap-4 text-sm">
                                                    <label className="flex items-center gap-2">
                                                        <Checkbox checked={c.can_view_order_book} onCheckedChange={(v) => setCo(i, { can_view_order_book: v === true })} />{' '}
                                                        View order book
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <Checkbox checked={c.can_confirm_payments} onCheckedChange={(v) => setCo(i, { can_confirm_payments: v === true })} />{' '}
                                                        Confirm investor payments
                                                    </label>
                                                </div>
                                                <div className="grid gap-2 sm:grid-cols-3">
                                                    <Input
                                                        placeholder="Bank (for investor payments)"
                                                        value={c.bank_name}
                                                        onChange={(e) => setCo(i, { bank_name: e.target.value })}
                                                        aria-label="Co-sponsor bank"
                                                    />
                                                    <Input
                                                        placeholder="Account name"
                                                        value={c.bank_account_name}
                                                        onChange={(e) => setCo(i, { bank_account_name: e.target.value })}
                                                        aria-label="Co-sponsor account name"
                                                    />
                                                    <Input
                                                        placeholder="Account number"
                                                        inputMode="numeric"
                                                        maxLength={10}
                                                        value={c.bank_account_number}
                                                        onChange={(e) => setCo(i, { bank_account_number: e.target.value.replace(/\D/g, '') })}
                                                        aria-label="Co-sponsor account number"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Section>
                    )}

                    {step === DOCUMENTS_STEP && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="Supporting Documents"
                            description={
                                type
                                    ? `Required for ${type.label}. Files are uploaded together with the offer when you save, so you can attach them now.`
                                    : 'Choose a security type first.'
                            }
                        >
                            {required.length > 0 ? (
                                <div className="space-y-4">
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                                            <span>
                                                {required.length - missingDocs.length} of {required.length} ready
                                            </span>
                                            {missingDocs.length === 0 ? (
                                                <span className="text-emerald-600 dark:text-emerald-400">All required documents attached</span>
                                            ) : (
                                                <span className="text-muted-foreground">Needed before it can be sent for approval</span>
                                            )}
                                        </div>
                                        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                                            <div
                                                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                                                style={{ width: `${((required.length - missingDocs.length) / required.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {required.map((docType, i) => (
                                            <DocumentSlot
                                                key={docType}
                                                type={docType}
                                                state={slot(docType)}
                                                error={errors[`new_documents.${i}.file`]}
                                                onPick={(file) => pick(docType, file)}
                                                onRemove={() => removeDoc(docType)}
                                            />
                                        ))}
                                    </div>
                                    <InputError message={errors.documents} />
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">No supporting documents are required for this security type.</p>
                            )}
                        </Section>
                    )}

                    {step === LAST && (
                        <div className="space-y-4">
                            <Section title="Issuer and Security" actions={editStep(0)}>
                                <DetailList
                                    items={[
                                        { label: 'Issuer', value: form.data.issuer_name },
                                        { label: 'Issuer Type', value: form.data.issuer_type },
                                        { label: 'Security Type', value: type?.label },
                                        { label: 'Issue Series', value: form.data.issue_series },
                                        { label: 'Issue Description', value: form.data.issue_description, wide: true }
                                    ]}
                                />
                            </Section>
                            <Section title="Offer Terms" actions={editStep(1)}>
                                <DetailList
                                    columns={3}
                                    items={[
                                        { label: 'Offer Size', value: `Up to ${formatMoney(form.data.offer_size, 0)}` },
                                        { label: 'Minimum Threshold', value: `${form.data.min_subscription_threshold}%` },
                                        { label: 'Minimum Subscription', value: formatMoney(form.data.min_subscription_amount, 0) },
                                        { label: 'Subsequent Increments', value: formatMoney(form.data.subsequent_increment, 0) },
                                        { label: 'Opens', value: formatDateTime(form.data.open_at) },
                                        { label: 'Closes', value: formatDateTime(form.data.close_at) },
                                        { label: 'Tenor', value: form.data.tenor },
                                        { label: 'Day Count Fraction', value: form.data.day_count_fraction }
                                    ]}
                                />
                            </Section>
                            <Section title="Price Discovery" actions={editStep(2)}>
                                <DetailList
                                    columns={3}
                                    items={[
                                        { label: 'Method', value: options.methods[method] },
                                        { label: rateLabel(form.data.security_type), value: rateSummary },
                                        { label: 'Implied Yield', value: `${form.data.implied_yield}%` },
                                        { label: 'Issue Price per Unit', value: formatMoney(form.data.issue_price) },
                                        { label: 'Maturity Date', value: form.data.maturity_date ? formatDate(form.data.maturity_date) : '' },
                                        { label: 'Allotment Date', value: formatDate(form.data.allotment_date) }
                                    ]}
                                />
                            </Section>
                            <Section title="Investor Universe and Payment" actions={editStep(3)}>
                                <DetailList
                                    items={[
                                        { label: 'Investor Universe', value: form.data.investor_universe.map((c) => options.categories[c]).join(', '), wide: true },
                                        { label: 'Payment Account', value: `${form.data.bank_name} · ${form.data.bank_account_name} · ${form.data.bank_account_number}`, wide: true },
                                        {
                                            label: 'Receiving Agents',
                                            value: form.data.uses_receiving_agents ? `${form.data.receiving_agents.length} agent(s)` : 'Not used'
                                        },
                                        {
                                            label: 'Co-Sponsors',
                                            value: form.data.co_sponsors.length ? form.data.co_sponsors.map((c) => sponsorName(c.institution_id)).join(', ') : 'None'
                                        }
                                    ]}
                                />
                            </Section>
                            <Section title="Supporting Documents" actions={editStep(DOCUMENTS_STEP)}>
                                {required.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">None required.</p>
                                ) : (
                                    <ul className="grid gap-2 sm:grid-cols-2">
                                        {required.map((docType) => {
                                            const s = slot(docType);
                                            return (
                                                <li key={docType} className="flex items-center gap-2 text-sm">
                                                    {s.kind === 'empty' ? (
                                                        <AlertCircle className="size-4 shrink-0 text-amber-500" />
                                                    ) : (
                                                        <Check className="size-4 shrink-0 text-emerald-600" />
                                                    )}
                                                    <span className="font-medium">{docType}</span>
                                                    <span className="text-muted-foreground truncate text-xs">
                                                        {s.kind === 'empty' ? 'Missing' : s.kind === 'pending' ? s.file.name : s.name}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                                {missingDocs.length > 0 && (
                                    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                        Attach the missing document(s) before sending for approval. You can still save the offer as a draft.
                                    </p>
                                )}
                            </Section>
                        </div>
                    )}

                    <div className="bg-background/90 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t py-4 backdrop-blur">
                        <Button variant="ghost" asChild>
                            <Link href={editing ? route('tsp.offers.show', offer!.id) : route('tsp.offers.index')}>Cancel</Link>
                        </Button>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-muted-foreground mr-1 hidden text-xs sm:inline">
                                Step {step + 1} of {STEPS.length}
                            </span>
                            {step > 0 && (
                                <Button type="button" variant="outline" onClick={() => show(step - 1)}>
                                    <ArrowLeft className="size-4" /> Back
                                </Button>
                            )}
                            <Button type="button" variant="outline" disabled={form.processing} onClick={() => void save(false)}>
                                <Save className="size-4" /> Save Draft
                            </Button>
                            {step < LAST ? (
                                <Button type="submit">
                                    Next <ArrowRight className="size-4" />
                                </Button>
                            ) : (
                                <Button type="button" disabled={form.processing} onClick={() => void save(true)}>
                                    {form.processing ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    Send for Approval
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Page>
        </AppLayout>
    );
}
