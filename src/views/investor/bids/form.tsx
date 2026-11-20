import { CommitmentSheet, type CommitmentValues } from '@/components/bids/commitment-sheet';
import { Field, FileField, MoneyField, SelectField, TextField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { rateSummary } from '@/components/offers/offer-detail';
import { PageHeader } from '@/components/page-header';
import { DetailList, Page, Section } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { confirmSubmit } from '@/lib/alert';
import { Head, Link, useForm } from '@/lib/app';
import { amountInWords, formatDateTime, formatMoney, toNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Bid, type Offer, type PayeeOption } from '@/types';
import { WizardSteps } from '@/components/wizard-steps';
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, Eye, Landmark, LoaderCircle, PencilLine, Send } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    offer: Offer;
    bid: Bid | null;
    payees: PayeeOption[];
    investorTypes: Record<string, string>;
    defaults: {
        investor_type: string;
        csd_name: string | null;
        csd_account_number: string | null;
        bank_name: string | null;
        bank_account_name: string | null;
        bank_account_number: string | null;
    };
    /** Pre-fills the participant details from the account. */
    participant?: { surname: string; first_name: string; contact_person: string; address_line_1: string; phone: string; email: string };
    /** Signed links to the signatures / seal already on this bid (when amending). */
    commitmentFiles?: Partial<Record<'signature_1' | 'signature_2' | 'official_seal', string>>;
    /** QPay is offered once FMDQ has a service code for subscription payments. */
    qpayEnabled?: boolean;
}

type PayWith = 'qpay' | 'bank_transfer';
type ImageKey = 'signature_1' | 'signature_2' | 'official_seal';

const IMAGE_ACCEPT = '.jpg,.jpeg,.png';

const STEPS = [
    { title: 'Your Bid' },
    { title: 'Participant Details' },
    { title: 'Allotment' },
    { title: 'Bank Details' },
    { title: 'Signatures' },
    { title: 'Payment' },
    { title: 'Review & Submit' }
];
const LAST = STEPS.length - 1;

const blank = (v: unknown) => v === null || v === undefined || String(v).trim() === '';

/** The wizard step that holds a field, so a refused submission opens the right step. */
const stepOf = (field: string): number => {
    if (/^(investor_type|amount|rate|yield|order_\d_)/.test(field)) return 0;
    if (/^(surname|first_name|other_names|joint_|contact_person|address_line_|phone|city|state|email)/.test(field)) return 1;
    if (/^(allotment_preference|cscs_|clearing_house_no|stockbroking_|fmdq_bpid_no|client_bpid_no|csd_)/.test(field)) return 2;
    if (/^(bank_|branch|security_dealer)/.test(field)) return 3;
    if (/^(signature_|official_seal)/.test(field)) return 4;
    if (/^(payee_|payment_reference|evidence|pay_with)/.test(field)) return 5;
    return LAST;
};

/**
 * Commitment form (CR s6.1-6.2) with every field of the legacy Standardised Commitment Form,
 * entered in the platform's own style; "Preview Commitment Form" shows it exactly as the
 * legacy paper form. No OTP here: the login OTP replaces it.
 */
export default function BidForm({
    offer,
    bid,
    payees,
    investorTypes,
    defaults,
    participant,
    commitmentFiles = {},
    qpayEnabled = false
}: Props) {
    const editing = bid !== null;
    const alreadyPaid = bid?.payment_status === 'paid';
    const c = (bid?.commitment ?? {}) as Record<string, string | null | undefined>;
    const orders = bid?.commitment?.orders ?? [];
    const order = (n: number) => orders.find((o) => o.order === n);
    // Bids made before the commitment form existed: the CSD account goes in its legacy box.
    const legacyCscs = !bid?.commitment && /cscs/i.test(bid?.csd_name ?? defaults.csd_name ?? '');
    const legacyCsd = bid?.commitment ? null : (bid?.csd_account_number ?? defaults.csd_account_number ?? '');
    const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

    const form = useForm<{
        investor_type: string;
        amount: string;
        rate: string;
        yield: string;
        order_2_amount: string;
        order_2_rate: string;
        order_3_amount: string;
        order_3_rate: string;
        surname: string;
        first_name: string;
        other_names: string;
        joint_first_name: string;
        joint_other_names: string;
        contact_person: string;
        address_line_1: string;
        address_line_2: string;
        address_line_3: string;
        phone: string;
        city: string;
        state: string;
        email: string;
        allotment_preference: string;
        cscs_account_no: string;
        clearing_house_no: string;
        stockbroking_firm_cscs: string;
        fmdq_bpid_no: string;
        client_bpid_no: string;
        stockbroking_firm_fmdq: string;
        bank_name: string;
        branch: string;
        bank_account_name: string;
        bank_account_number: string;
        bank_city_state: string;
        security_dealer: string;
        signature_1: File | null;
        signature_2: File | null;
        official_seal: File | null;
        payee_type: string;
        payee_id: string;
        payment_reference: string;
        evidence: File | null;
        pay_with: PayWith;
        declaration: boolean;
        _method?: string;
    }>({
        // Online first when it is available, as on the platform-fee payment.
        pay_with: qpayEnabled && !alreadyPaid ? 'qpay' : 'bank_transfer',
        investor_type: bid?.investor_type ?? defaults.investor_type ?? '',
        amount: order(1)?.amount ?? bid?.amount ?? '',
        rate: bid?.rate ?? '',
        yield: bid?.yield ?? '',
        order_2_amount: s(order(2)?.amount),
        order_2_rate: s(order(2)?.rate),
        order_3_amount: s(order(3)?.amount),
        order_3_rate: s(order(3)?.rate),
        surname: s(c.surname ?? participant?.surname),
        first_name: s(c.first_name ?? participant?.first_name),
        other_names: s(c.other_names),
        joint_first_name: s(c.joint_first_name),
        joint_other_names: s(c.joint_other_names),
        contact_person: s(c.contact_person ?? participant?.contact_person),
        address_line_1: s(c.address_line_1 ?? participant?.address_line_1),
        address_line_2: s(c.address_line_2),
        address_line_3: s(c.address_line_3),
        phone: s(c.phone ?? participant?.phone),
        city: s(c.city),
        state: s(c.state),
        email: s(c.email ?? participant?.email),
        allotment_preference: s(c.allotment_preference ?? 'book_entry'),
        cscs_account_no: s(c.cscs_account_no),
        clearing_house_no: s(c.clearing_house_no ?? (legacyCscs ? legacyCsd : '')),
        stockbroking_firm_cscs: s(c.stockbroking_firm_cscs),
        fmdq_bpid_no: s(c.fmdq_bpid_no),
        client_bpid_no: s(c.client_bpid_no ?? (!legacyCscs && legacyCsd ? legacyCsd : '')),
        stockbroking_firm_fmdq: s(c.stockbroking_firm_fmdq),
        bank_name: bid?.bank_name ?? defaults.bank_name ?? '',
        branch: s(c.branch),
        bank_account_name: bid?.bank_account_name ?? defaults.bank_account_name ?? '',
        bank_account_number: bid?.bank_account_number ?? defaults.bank_account_number ?? '',
        bank_city_state: s(c.bank_city_state),
        security_dealer: s(c.security_dealer),
        signature_1: null,
        signature_2: null,
        official_seal: null,
        payee_type: bid?.payee_type ?? payees[0]?.type ?? 'sponsor',
        payee_id: bid?.payee_id ? String(bid.payee_id) : payees[0]?.id ? String(payees[0].id) : '',
        payment_reference: bid?.payment_reference ?? '',
        evidence: null,
        declaration: false
    });
    const d = form.data;
    const errors = form.errors as Record<string, string>;
    const min = toNumber(offer.min_subscription_amount);
    const increment = toNumber(offer.subsequent_increment);
    const fixed = offer.price_discovery_method === 'fixed_rate';
    const priceBased = offer.security_type === 'equities' || offer.security_type === 'depository_receipts';
    const orderAmounts = [toNumber(d.amount), toNumber(d.order_2_amount), toNumber(d.order_3_amount)];
    const total = orderAmounts.reduce((sum, a) => sum + (a > 0 ? a : 0), 0);
    const amountProblem = (amount: number) =>
        amount < min
            ? `Below the minimum of ${formatMoney(min, 0)}.`
            : increment > 0 && amount > min && Math.round((amount - min) * 100) % Math.round(increment * 100) !== 0
              ? `Above the minimum, amounts go up in steps of ${formatMoney(increment, 0)}.`
              : null;
    const hintFor = (amount: number, optional: boolean) =>
        (amount > 0 && amountProblem(amount)) ||
        `${optional ? 'Optional. ' : ''}Minimum ${formatMoney(min, 0)}${increment > 0 ? `, then multiples of ${formatMoney(increment, 0)}` : ''}.`;
    const selected = payees.find((p) => p.type === d.payee_type && String(p.id ?? '') === d.payee_id) ?? payees[0];
    const viaQPay = !alreadyPaid && d.pay_with === 'qpay';

    // Previews of newly chosen signature / seal images (object URLs, released when replaced).
    const pickedUrls = useMemo(() => {
        const urls: Partial<Record<ImageKey, string>> = {};
        (['signature_1', 'signature_2', 'official_seal'] as ImageKey[]).forEach((key) => {
            const file = d[key];
            if (file) urls[key] = URL.createObjectURL(file);
        });
        return urls;
    }, [d.signature_1, d.signature_2, d.official_seal]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => () => Object.values(pickedUrls).forEach((url) => url && URL.revokeObjectURL(url)), [pickedUrls]);
    const images = { ...commitmentFiles, ...pickedUrls };

    const sheetValues: CommitmentValues = {
        ...d,
        date: bid?.submitted_at ?? new Date().toISOString().slice(0, 10),
        control_no: s(c.control_no),
        orders: [
            { amount: d.amount, rate: fixed ? offer.rate : d.rate },
            { amount: d.order_2_amount, rate: fixed ? offer.rate : d.order_2_rate },
            { amount: d.order_3_amount, rate: fixed ? offer.rate : d.order_3_rate }
        ].filter((o) => toNumber(o.amount) > 0),
        sponsor: selected?.name,
        co_sponsors: payees.filter((p) => p.type === 'co_sponsor').map((p) => p.name)
    };

    const [previewing, setPreviewing] = useState(false);

    // ── Wizard navigation ──────────────────────────────────────────────────────────────
    const [step, setStep] = useState(0);
    // Amending: every step was filled before, so all can be opened directly.
    const [reached, setReached] = useState(editing ? LAST : 0);
    const top = useRef<HTMLDivElement>(null);
    const show = (i: number) => {
        setStep(i);
        setReached((r) => Math.max(r, i));
        top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /** Client-side checks for one step, mirroring the API's BidRequest rules. */
    const checkStep = (i: number): Record<string, string> => {
        const e: Record<string, string> = {};
        if (i === 0) {
            if (blank(d.investor_type)) e.investor_type = 'Select the participant type.';
            (
                [
                    ['amount', 'rate', true],
                    ['order_2_amount', 'order_2_rate', false],
                    ['order_3_amount', 'order_3_rate', false]
                ] as const
            ).forEach(([amountKey, rateKey, needed]) => {
                const amount = toNumber(d[amountKey]);
                if (!(amount > 0)) {
                    if (needed) e[amountKey] = 'Enter the participation amount.';
                    return;
                }
                const problem = amountProblem(amount);
                if (problem) e[amountKey] = problem;
                if (!fixed && !(toNumber(d[rateKey]) > 0)) e[rateKey] = `Enter the bid ${offer.rate_label.toLowerCase()}.`;
            });
        }
        if (i === 1) {
            if (blank(d.surname)) e.surname = 'Enter the surname or corporate name.';
            if (blank(d.contact_person)) e.contact_person = 'Enter the contact person or next of kin.';
            if (blank(d.address_line_1)) e.address_line_1 = 'Enter the address.';
            if (blank(d.phone)) e.phone = 'Enter the telephone number.';
            if (blank(d.email)) e.email = 'Enter the email address.';
            else if (!/^\S+@\S+\.\S+$/.test(d.email)) e.email = 'Enter a valid email address.';
            if (blank(d.city)) e.city = 'Enter the city.';
            if (blank(d.state)) e.state = 'Enter the state.';
        }
        if (i === 2) {
            if (blank(d.allotment_preference)) e.allotment_preference = 'Choose the allotment preference.';
            if (blank(d.clearing_house_no) && blank(d.client_bpid_no))
                e.clearing_house_no = 'Enter your CHN, or your Client BPID below, for the allotment to be lodged.';
        }
        if (i === 3) {
            if (blank(d.bank_name)) e.bank_name = 'Enter the bank name.';
            if (blank(d.bank_account_name)) e.bank_account_name = 'Enter the account name.';
            if (!/^\d{10}$/.test(d.bank_account_number)) e.bank_account_number = 'Enter a 10-digit NUBAN account number.';
        }
        if (i === 4 && !d.signature_1 && !commitmentFiles.signature_1) e.signature_1 = 'Upload the first signature.';
        if (i === 5 && payees.length === 0) e.payee_id = 'No sponsor or receiving agent is available for this offer.';
        return e;
    };

    const flag = (found: Record<string, string>) => {
        form.clearErrors();
        Object.entries(found).forEach(([field, message]) => form.setError(field as keyof typeof d, message));
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

    // A submission the server refused opens the step that holds the first error.
    const errorKeys = Object.keys(errors).join('|');
    useEffect(() => {
        if (!errorKeys) return;
        const first = Math.min(...errorKeys.split('|').map(stepOf));
        if (first !== step) show(first);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errorKeys]);
    const errorSteps = new Set(Object.keys(errors).map(stepOf));

    const send = async () => {
        for (let i = 0; i < LAST; i++) {
            const found = checkStep(i);
            if (Object.keys(found).length) {
                show(i);
                return flag(found);
            }
        }
        if (!d.declaration) {
            form.setError('declaration', 'Confirm that you have read the offer documents and that the details are correct.');
            return;
        }
        const then = viaQPay ? ` You will then be taken to QPay to pay ${formatMoney(total, 0)} online.` : '';
        const confirmed = await confirmSubmit(
            editing
                ? {
                      title: 'Amend Your Bid?',
                      text: `Your bid on ${offer.issuer_name} will be updated to ${formatMoney(total, 0)}.${then}`,
                      confirmText: viaQPay ? 'Yes, Amend and Pay' : 'Yes, Amend Bid'
                  }
                : {
                      title: 'Place This Bid?',
                      text: `You are bidding ${formatMoney(total, 0)} on ${offer.issuer_name}.${then}`,
                      confirmText: viaQPay ? 'Yes, Place and Pay' : 'Yes, Place Bid'
                  }
        );
        if (!confirmed) return;
        // Paying online: no evidence to send; the bid is paid on QPay's return.
        const payment = (values: typeof form.data) => (viaQPay ? { ...values, evidence: null, payment_reference: '' } : values);
        if (editing) {
            form.transform((values) => ({ ...payment(values), _method: 'put' }));
            form.post(route('investor.bids.update', bid!.id), { forceFormData: true });
        } else {
            form.transform((values) => payment(values));
            form.post(route('investor.bids.store', offer.id), { forceFormData: true });
        }
    };

    // Enter moves to the next step; the bid is only submitted from the review step's button.
    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (step < LAST) next();
    };

    const rateField = (key: 'rate' | 'order_2_rate' | 'order_3_rate', required: boolean) =>
        fixed ? (
            <Field label={offer.rate_label}>
                <p className="py-2 text-sm font-medium">{rateSummary(offer)} (fixed)</p>
            </Field>
        ) : (
            <TextField
                label={`Bid ${offer.rate_label}${priceBased ? '' : ' (%)'}`}
                type="number"
                step="0.0001"
                required={required}
                value={d[key]}
                onChange={(v) => form.setData(key, v)}
                error={errors[key]}
                hint={offer.price_discovery_method === 'book_building' ? `Within the range ${rateSummary(offer)}.` : undefined}
            />
        );

    const orderRow = (n: 1 | 2 | 3) => {
        const amountKey = n === 1 ? 'amount' : n === 2 ? 'order_2_amount' : 'order_3_amount';
        const rateKey = n === 1 ? 'rate' : n === 2 ? 'order_2_rate' : 'order_3_rate';
        const value = orderAmounts[n - 1];
        return (
            <div key={n} className="rounded-lg border p-4">
                <p className="text-navy mb-3 text-sm font-semibold dark:text-white">
                    Order {n}
                    {n > 1 && <span className="text-muted-foreground ml-1 font-normal">(optional)</span>}
                </p>
                <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                    <div>
                        <MoneyField
                            label="Participation Amount"
                            required={n === 1}
                            value={d[amountKey]}
                            onChange={(v) => form.setData(amountKey, v)}
                            error={errors[amountKey]}
                            hint={hintFor(value, n > 1)}
                        />
                        {value > 0 && <p className="text-muted-foreground mt-1 text-xs italic">{amountInWords(value)}</p>}
                    </div>
                    {(n === 1 || value > 0) && rateField(rateKey, !fixed)}
                </div>
            </div>
        );
    };

    const imageField = (key: ImageKey, label: string, required: boolean) => (
        <div className="space-y-2">
            <FileField
                label={label}
                required={required}
                accept={IMAGE_ACCEPT}
                maxSizeMB={2}
                file={d[key]}
                onChange={(f) => form.setData(key, f)}
                error={errors[key]}
                hint={images[key] && !d[key] ? 'Already provided; choose a file to replace it.' : 'JPG or PNG, up to 2 MB.'}
            />
            {images[key] && (
                <div className="bg-muted/40 flex h-20 items-center justify-center rounded-md border">
                    <img src={images[key]} alt={label} className="max-h-16 max-w-[80%] object-contain" />
                </div>
            )}
        </div>
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Offers', href: route('investor.offers.index') },
                { title: offer.issuer_name, href: route('investor.offers.show', offer.id) },
                { title: editing ? 'Amend bid' : 'Commitment form', href: '#' }
            ]}
        >
            <Head title={editing ? 'Amend bid' : 'Commitment form'} />
            <Page className="mx-auto w-full max-w-4xl">
                <PageHeader
                    title={editing ? `Amend Bid ${bid!.reference}` : 'Standardised Commitment Form'}
                    description={`${offer.issuer_name} · ${offer.reference} · closes ${formatDateTime(offer.close_at)}`}
                    actions={
                        <Button type="button" variant="outline" onClick={() => setPreviewing(true)}>
                            <Eye className="size-4" /> Preview Commitment Form
                        </Button>
                    }
                />
                <div ref={top} className="scroll-mt-20" />
                <WizardSteps
                    steps={STEPS.map((s, i) => (i === 0 && total > 0 ? { ...s, badge: formatMoney(total, 0) } : s))}
                    current={step}
                    reached={reached}
                    errorSteps={errorSteps}
                    onSelect={goTo}
                />
                <form onSubmit={submit} noValidate className="space-y-6">
                    {step === 0 && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="1. Your Bid"
                            description="Up to three optional orders, each with its participation amount and bid rate. Your bid amount is their total."
                        >
                            <div className="space-y-4">
                                <SelectField
                                    label="Participant Type"
                                    required
                                    value={d.investor_type}
                                    onChange={(v) => form.setData('investor_type', v)}
                                    options={Object.entries(investorTypes).map(([value, label]) => ({ value, label }))}
                                    error={errors.investor_type}
                                    hint="Ticked on the commitment form; also used for investor-type-based pro-rata allotment."
                                />
                                {orderRow(1)}
                                {orderRow(2)}
                                {orderRow(3)}
                                <div className="from-navy/[0.05] dark:from-primary/10 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-linear-to-r to-transparent px-4 py-3">
                                    <span className="text-sm font-medium">Total participation amount</span>
                                    <span className="text-navy text-lg font-semibold tabular-nums dark:text-white">
                                        {total > 0 ? formatMoney(total, 2) : '—'}
                                    </span>
                                </div>
                                <TextField
                                    label="Bid Yield (%)"
                                    type="number"
                                    step="0.0001"
                                    value={d.yield}
                                    onChange={(v) => form.setData('yield', v)}
                                    error={errors.yield}
                                    hint="Optional"
                                />
                            </div>
                        </Section>
                    )}

                    {step === 1 && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="2. Participant Details"
                            description="Individual, corporate or joint applicant, as it should appear on the commitment form (block letters)."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField
                                    label="Surname / Corporate Name"
                                    required
                                    value={d.surname}
                                    onChange={(v) => form.setData('surname', v)}
                                    error={errors.surname}
                                    className="sm:col-span-2"
                                />
                                <TextField
                                    label="First Name (Individuals Only)"
                                    value={d.first_name}
                                    onChange={(v) => form.setData('first_name', v)}
                                    error={errors.first_name}
                                />
                                <TextField
                                    label="Other Names (Individuals Only)"
                                    value={d.other_names}
                                    onChange={(v) => form.setData('other_names', v)}
                                    error={errors.other_names}
                                />
                                <TextField
                                    label="Joint Applicant's First Name (If Applicable)"
                                    value={d.joint_first_name}
                                    onChange={(v) => form.setData('joint_first_name', v)}
                                    error={errors.joint_first_name}
                                />
                                <TextField
                                    label="Other Names (Joint Applicants Only)"
                                    value={d.joint_other_names}
                                    onChange={(v) => form.setData('joint_other_names', v)}
                                    error={errors.joint_other_names}
                                />
                                <TextField
                                    label="Contact Person (Corporate) / Next of Kin (Individual)"
                                    required
                                    value={d.contact_person}
                                    onChange={(v) => form.setData('contact_person', v)}
                                    error={errors.contact_person}
                                    className="sm:col-span-2"
                                />
                                <TextField
                                    label="Address in Full"
                                    required
                                    value={d.address_line_1}
                                    onChange={(v) => form.setData('address_line_1', v)}
                                    error={errors.address_line_1}
                                    hint="Please do not repeat the applicant's name. A post box number alone is not sufficient."
                                    className="sm:col-span-2"
                                />
                                <TextField
                                    label="Address Line 2"
                                    value={d.address_line_2}
                                    onChange={(v) => form.setData('address_line_2', v)}
                                    error={errors.address_line_2}
                                />
                                <TextField
                                    label="Address Line 3"
                                    value={d.address_line_3}
                                    onChange={(v) => form.setData('address_line_3', v)}
                                    error={errors.address_line_3}
                                />
                                <TextField
                                    label="Telephone"
                                    required
                                    type="tel"
                                    value={d.phone}
                                    onChange={(v) => form.setData('phone', v)}
                                    error={errors.phone}
                                />
                                <TextField
                                    label="Email"
                                    required
                                    type="email"
                                    value={d.email}
                                    onChange={(v) => form.setData('email', v)}
                                    error={errors.email}
                                />
                                <TextField
                                    label="City"
                                    required
                                    value={d.city}
                                    onChange={(v) => form.setData('city', v)}
                                    error={errors.city}
                                />
                                <TextField
                                    label="State"
                                    required
                                    value={d.state}
                                    onChange={(v) => form.setData('state', v)}
                                    error={errors.state}
                                />
                            </div>
                        </Section>
                    )}

                    {step === 2 && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="3. Allotment Preference and E-Allotment"
                            description="For book-entry allotment, give your CSCS details or your FMDQ Depository (Q-ex) details."
                        >
                            <div className="space-y-5">
                                <Field label="Allotment Preference" required error={errors.allotment_preference}>
                                    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Allotment preference">
                                        {[
                                            ['certificate', 'Certificate'],
                                            ['book_entry', 'Electronic (Book Entry)']
                                        ].map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                role="radio"
                                                aria-checked={d.allotment_preference === value}
                                                onClick={() => form.setData('allotment_preference', value)}
                                                className={cn(
                                                    'rounded-lg border px-4 py-2.5 text-left text-sm transition',
                                                    d.allotment_preference === value
                                                        ? 'border-navy bg-navy/5 dark:border-primary dark:bg-primary/10 font-medium'
                                                        : 'hover:border-navy/40'
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </Field>
                                <div className="rounded-lg border p-4">
                                    <p className="mb-3 text-sm font-semibold">CSCS</p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <TextField
                                            label="Participant's CSCS Account No."
                                            value={d.cscs_account_no}
                                            onChange={(v) => form.setData('cscs_account_no', v)}
                                            error={errors.cscs_account_no}
                                        />
                                        <TextField
                                            label="CHN (Clearing House Number)"
                                            value={d.clearing_house_no}
                                            onChange={(v) => form.setData('clearing_house_no', v)}
                                            error={errors.clearing_house_no ?? errors.csd_account_number}
                                        />
                                        <TextField
                                            label="Name of Stockbroking Firm"
                                            value={d.stockbroking_firm_cscs}
                                            onChange={(v) => form.setData('stockbroking_firm_cscs', v)}
                                            error={errors.stockbroking_firm_cscs}
                                            className="sm:col-span-2"
                                        />
                                    </div>
                                </div>
                                <div className="rounded-lg border p-4">
                                    <p className="mb-3 text-sm font-semibold">FMDQ Depository (Q-ex)</p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <TextField
                                            label="FMDQ Depository Participant's BPID No."
                                            value={d.fmdq_bpid_no}
                                            onChange={(v) => form.setData('fmdq_bpid_no', v)}
                                            error={errors.fmdq_bpid_no}
                                        />
                                        <TextField
                                            label="Client BPID No."
                                            value={d.client_bpid_no}
                                            onChange={(v) => form.setData('client_bpid_no', v)}
                                            error={errors.client_bpid_no}
                                        />
                                        <TextField
                                            label="Name of Stockbroking Firm"
                                            value={d.stockbroking_firm_fmdq}
                                            onChange={(v) => form.setData('stockbroking_firm_fmdq', v)}
                                            error={errors.stockbroking_firm_fmdq}
                                            className="sm:col-span-2"
                                        />
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    Your allotment is lodged to the CHN if given, otherwise to the Client BPID. At least one of the two is
                                    required.
                                </p>
                            </div>
                        </Section>
                    )}

                    {step === 3 && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="4. Bank Details for E-Payments"
                            description="The account refunds are paid into."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField
                                    label="Bank Name"
                                    required
                                    value={d.bank_name}
                                    onChange={(v) => form.setData('bank_name', v)}
                                    error={errors.bank_name}
                                />
                                <TextField
                                    label="Branch"
                                    value={d.branch}
                                    onChange={(v) => form.setData('branch', v)}
                                    error={errors.branch}
                                />
                                <TextField
                                    label="Account No. (NUBAN)"
                                    required
                                    inputMode="numeric"
                                    maxLength={10}
                                    value={d.bank_account_number}
                                    onChange={(v) => form.setData('bank_account_number', v.replace(/\D/g, ''))}
                                    error={errors.bank_account_number}
                                />
                                <TextField
                                    label="City / State"
                                    value={d.bank_city_state}
                                    onChange={(v) => form.setData('bank_city_state', v)}
                                    error={errors.bank_city_state}
                                />
                                <TextField
                                    label="Account Name"
                                    required
                                    value={d.bank_account_name}
                                    onChange={(v) => form.setData('bank_account_name', v)}
                                    error={errors.bank_account_name}
                                />
                                <TextField
                                    label="Security Dealer"
                                    value={d.security_dealer}
                                    onChange={(v) => form.setData('security_dealer', v)}
                                    error={errors.security_dealer}
                                />
                            </div>
                        </Section>
                    )}

                    {step === 4 && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="5. Signatures"
                            description="Images of the signatures and the official seal, as on the signed paper form."
                        >
                            <div className="grid gap-4 sm:grid-cols-3">
                                {imageField('signature_1', 'First Signature', !commitmentFiles.signature_1)}
                                {imageField('signature_2', '2nd Signature (Corporate / Joint)', false)}
                                {imageField('official_seal', 'Official Seal / RC. No.', false)}
                            </div>
                        </Section>
                    )}

                    {step === 5 && (
                        <Section
                            className="[&_h2]:tracking-wide [&_h2]:uppercase"
                            title="6. Payment"
                            description={
                                qpayEnabled
                                    ? 'Pay online with QPay, or by bank transfer to the receiving agent or sponsor of your choice. Your bid is placed whether or not payment is confirmed yet.'
                                    : 'Pay the receiving agent or sponsor of your choice and upload evidence. Your bid is placed whether or not payment is confirmed yet.'
                            }
                        >
                            <div className="space-y-4">
                                {alreadyPaid && (
                                    <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                                        <CheckCircle2 className="size-4 shrink-0" /> Payment for this bid is confirmed
                                        {bid?.payment_reference ? ` (ref ${bid.payment_reference})` : ''}.
                                    </p>
                                )}

                                {/* Same choice as the platform-fee payment: online with QPay, or bank transfer with evidence. */}
                                {qpayEnabled && !alreadyPaid && (
                                    <Field label="Payment Method" required error={errors.pay_with}>
                                        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
                                            {(
                                                [
                                                    [
                                                        'qpay',
                                                        'Pay Online with QPay',
                                                        'Pay securely online; your bid is marked paid as soon as QPay confirms.',
                                                        CreditCard
                                                    ],
                                                    [
                                                        'bank_transfer',
                                                        'Bank Transfer',
                                                        'Transfer to the account below, then upload the evidence of payment.',
                                                        Landmark
                                                    ]
                                                ] as const
                                            ).map(([value, title, hint, Icon]) => (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={d.pay_with === value}
                                                    onClick={() => form.setData('pay_with', value)}
                                                    className={cn(
                                                        'flex items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition',
                                                        d.pay_with === value
                                                            ? 'border-navy bg-navy/5 dark:border-primary dark:bg-primary/10'
                                                            : 'hover:border-navy/40'
                                                    )}
                                                >
                                                    <Icon className="text-gold mt-0.5 size-4 shrink-0" />
                                                    <span>
                                                        <span className="block font-medium">{title}</span>
                                                        <span className="text-muted-foreground mt-0.5 block text-xs">{hint}</span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </Field>
                                )}

                                <p className="text-sm font-medium">
                                    {viaQPay
                                        ? 'Sponsor / co-sponsor / receiving agent for your bid'
                                        : 'Pay to (sponsor / co-sponsor / receiving agent)'}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Pay to">
                                    {payees.map((p) => {
                                        const active = selected === p;
                                        return (
                                            <button
                                                type="button"
                                                key={`${p.type}-${p.id}`}
                                                role="radio"
                                                aria-checked={active}
                                                onClick={() =>
                                                    form.setData((v) => ({ ...v, payee_type: p.type, payee_id: p.id ? String(p.id) : '' }))
                                                }
                                                className={cn(
                                                    'rounded-lg border p-3 text-left text-sm',
                                                    active ? 'border-navy bg-navy/5' : 'hover:border-navy/40'
                                                )}
                                            >
                                                <span className="flex items-center gap-2 font-medium">
                                                    <Landmark className="text-gold size-4" /> {p.name}
                                                </span>
                                                <span className="text-muted-foreground mt-1 block text-xs">
                                                    {p.bank_name} · {p.account_name} · <span className="font-mono">{p.account_number}</span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={errors.payee_id ?? errors.payee_type} />
                                {viaQPay ? (
                                    <div className="from-navy/[0.06] dark:from-primary/10 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-linear-to-r to-transparent p-4">
                                        <div>
                                            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                                Amount to pay with QPay
                                            </p>
                                            <p className="text-navy text-2xl font-semibold tabular-nums dark:text-white">
                                                {total > 0 ? formatMoney(total, 2) : '—'}
                                            </p>
                                        </div>
                                        <p className="text-muted-foreground max-w-sm text-xs">
                                            After you {editing ? 'save the amendment' : 'place the bid'}, you are taken to QPay to pay. When
                                            QPay confirms, the payment is recorded against your bid automatically; no evidence upload is
                                            needed.
                                        </p>
                                    </div>
                                ) : (
                                    !alreadyPaid && (
                                        <>
                                            {selected && (
                                                <div className="bg-muted/50 rounded-lg border p-4">
                                                    <DetailList
                                                        columns={3}
                                                        items={[
                                                            { label: 'Bank', value: selected.bank_name },
                                                            { label: 'Account Name', value: selected.account_name },
                                                            {
                                                                label: 'Account Number',
                                                                value: (
                                                                    <span className="font-mono text-base">{selected.account_number}</span>
                                                                )
                                                            }
                                                        ]}
                                                    />
                                                </div>
                                            )}
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <TextField
                                                    label="Payment Reference"
                                                    value={d.payment_reference}
                                                    onChange={(v) => form.setData('payment_reference', v)}
                                                    error={errors.payment_reference}
                                                    hint="Optional"
                                                />
                                                <FileField
                                                    label="Evidence of Payment"
                                                    file={d.evidence}
                                                    onChange={(f) => form.setData('evidence', f)}
                                                    error={errors.evidence}
                                                    hint="Optional now; you can upload it later. PDF, JPG or PNG up to 5 MB."
                                                />
                                            </div>
                                        </>
                                    )
                                )}
                            </div>
                        </Section>
                    )}

                    {step === LAST && (
                        <>
                            {/* The commitment form exactly as the legacy platform presented it, filled in live. */}
                            <Section
                                className="[&_h2]:tracking-wide [&_h2]:uppercase"
                                title="7. Review Your Commitment Form"
                                description="Check every detail on the form below. Use Edit or the step bar to change anything, then submit."
                                flush
                            >
                                <div className="px-2 pb-2">
                                    <CommitmentSheet offer={offer} values={sheetValues} images={images} />
                                </div>
                            </Section>
                            <div className="bg-muted/40 grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-3">
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Total Bid</p>
                                    <p className="text-navy text-lg font-semibold tabular-nums dark:text-white">{formatMoney(total, 2)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Payment</p>
                                    <p className="font-medium">
                                        {alreadyPaid ? 'Already paid' : viaQPay ? 'Online with QPay' : 'Bank transfer'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                        {viaQPay ? 'Bid Placed Through' : 'Pay To'}
                                    </p>
                                    <p className="font-medium">{selected?.name ?? '—'}</p>
                                </div>
                            </div>
                            <Section>
                                <div className="flex items-start gap-2">
                                    <Checkbox
                                        id="declaration"
                                        checked={d.declaration}
                                        onCheckedChange={(v) => form.setData('declaration', v === true)}
                                        className="mt-0.5"
                                    />
                                    <Label htmlFor="declaration" className="text-sm leading-snug font-normal">
                                        I have read the offer documents, the details above are correct, and I understand that submitting a
                                        bid does not guarantee allocation or allotment.
                                    </Label>
                                </div>
                                <InputError message={errors.declaration} className="mt-2" />
                                {(errors.offer || errors.bid) && <InputError message={errors.offer ?? errors.bid} className="mt-2" />}
                                {Object.keys(errors).length > 0 && (
                                    <p className="text-destructive mt-3 text-sm">
                                        Please correct the highlighted fields ({Object.keys(errors).length}).
                                    </p>
                                )}
                            </Section>
                        </>
                    )}

                    <div className="bg-background/90 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t py-4 backdrop-blur">
                        <Button variant="ghost" asChild>
                            <Link href={editing ? route('investor.bids.show', bid!.id) : route('investor.offers.show', offer.id)}>
                                Cancel
                            </Link>
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
                            {step < LAST ? (
                                <Button type="submit">
                                    Next <ArrowRight className="size-4" />
                                </Button>
                            ) : (
                                <Button type="button" disabled={form.processing} onClick={() => void send()}>
                                    {form.processing ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    ) : viaQPay ? (
                                        <CreditCard className="size-4" />
                                    ) : (
                                        <Send className="size-4" />
                                    )}
                                    {editing
                                        ? viaQPay
                                            ? 'Save and Pay with QPay'
                                            : 'Save Amendment'
                                        : viaQPay
                                          ? 'Submit Bid and Pay with QPay'
                                          : 'Submit Bid'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </Page>

            {/* Quick look at the commitment form from any step. */}
            <Dialog open={previewing} onOpenChange={setPreviewing}>
                <DialogContent className="max-h-[92vh] w-[min(1100px,96vw)] max-w-none overflow-y-auto p-0 sm:max-w-none">
                    <DialogHeader className="border-b px-6 py-4">
                        <DialogTitle>Standardised Commitment Form</DialogTitle>
                        <DialogDescription>
                            {offer.issuer_name} · {offer.reference}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-2">
                        <CommitmentSheet offer={offer} values={sheetValues} images={images} />
                    </div>
                    <div className="bg-background sticky bottom-0 flex flex-wrap justify-end gap-2 border-t px-6 py-3">
                        <Button type="button" variant="outline" onClick={() => setPreviewing(false)}>
                            <PencilLine className="size-4" /> Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
