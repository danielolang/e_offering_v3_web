import { confirmSubmit } from '@/lib/alert';
import { FileField, TextField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { DetailList, Page, Section, Steps } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { feeStatus } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { type FeeInvoice, type Institution } from '@/types';
import { Head, Link, useForm } from '@/lib/app';
import { CheckCircle2, CreditCard, Landmark, LoaderCircle, Lock, ReceiptText } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Props {
    institution: Institution;
    feeEnabled: boolean;
    fullAccess: boolean;
    invoice: FeeInvoice | null;
    invoices: FeeInvoice[];
    bank: { bank_name: string; account_name: string; account_number: string };
    gateways: Record<string, string>;
}

/** CR s3.2 steps 5-12: landing "Registration" module, then the annual platform fee. */
export default function Registration({ institution, feeEnabled, fullAccess, invoice, invoices, bank, gateways }: Props) {
    const registered = !!institution.registration_completed_at;
    const details = useForm({
        registered_name: institution.registered_name ?? institution.name,
        registered_address: institution.registered_address ?? '',
        contact_name: institution.contact_name ?? '',
        contact_role: institution.contact_role ?? '',
        contact_phone: institution.contact_phone ?? '',
        bank_name: institution.bank_name ?? '',
        bank_account_name: institution.bank_account_name ?? '',
        bank_account_number: institution.bank_account_number ?? ''
    });
    const [method, setMethod] = useState<string>(() => Object.keys(gateways)[0] ?? 'qpay');
    const pay = useForm({ method });
    const transfer = useForm<{ evidence: File | null; reference: string }>({ evidence: null, reference: '' });
    const step = !registered ? 0 : fullAccess ? 2 : 1;
    // Submitted and fully active: the details are final (the API refuses changes too).
    const locked = registered && fullAccess;
    const payable = invoice && (invoice.status === 'unpaid' || invoice.status === 'rejected');

    const saveDetails = async (e: FormEvent) => {
        e.preventDefault();
        if (
            !(await confirmSubmit({
                title: 'Save Registration Details?',
                text: "Your institution's registration details will be updated.",
                confirmText: 'Yes, Save'
            }))
        )
            return;
        details.put(route('tsp.registration.update'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Registration', href: route('tsp.registration.show') }]}>
            <Head title="Registration" />
            <Page className="max-w-5xl">
                <PageHeader title="Registration" description={`${institution.name} · ${institution.reference}`} />
                <Section className="[&_ol]:tracking-wide [&_ol]:uppercase">
                    <Steps
                        steps={
                            feeEnabled ? ['Registration details', 'Platform fee', 'Full access'] : ['Registration details', 'Full access']
                        }
                        current={feeEnabled ? step : step === 0 ? 0 : 1}
                    />
                </Section>

                {institution.suspended_at && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                        Access to the Transaction Sponsor modules is suspended because the annual platform fee was not paid by the due date.
                        It is restored as soon as FMDQ confirms payment.
                    </div>
                )}
                {fullAccess && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                        <span className="flex items-center gap-2">
                            <CheckCircle2 className="size-4" /> You have full access to the Transaction Sponsor modules
                            {institution.fee_paid_until ? ` until ${formatDate(institution.fee_paid_until)}` : ''}.
                        </span>
                        <Button size="sm" asChild>
                            <Link href={route('tsp.dashboard')}>Go to Dashboard</Link>
                        </Button>
                    </div>
                )}

                <Section
                    className="[&_h2]:tracking-wide [&_h2]:uppercase"
                    title="Registration details"
                    description="Registered name and address, and the contact person for your institution."
                >
                    {locked ? (
                        <div className="space-y-5">
                            <DetailList
                                items={[
                                    { label: 'Registered Name', value: institution.registered_name },
                                    { label: 'Registered Address', value: institution.registered_address },
                                    { label: 'Contact Person Name', value: institution.contact_name },
                                    { label: 'Role of Contact Person', value: institution.contact_role },
                                    { label: 'Contact Number', value: institution.contact_phone }
                                ]}
                            />
                            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                                Default account for investor payments
                            </p>
                            <DetailList
                                columns={3}
                                items={[
                                    { label: 'Bank Name', value: institution.bank_name },
                                    { label: 'Account Name', value: institution.bank_account_name },
                                    { label: 'Account Number', value: <span className="font-mono">{institution.bank_account_number}</span> }
                                ]}
                            />
                            <p className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm">
                                <Lock className="size-4 shrink-0" /> Your registration is complete, so these details can no longer be
                                edited. Contact FMDQ if anything needs to change.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={saveDetails} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextField
                                    label="Registered Name"
                                    required
                                    value={details.data.registered_name}
                                    onChange={(v) => details.setData('registered_name', v)}
                                    error={details.errors.registered_name}
                                />
                                <TextField
                                    label="Registered Address"
                                    required
                                    value={details.data.registered_address}
                                    onChange={(v) => details.setData('registered_address', v)}
                                    error={details.errors.registered_address}
                                />
                                <TextField
                                    label="Contact Person Name"
                                    required
                                    value={details.data.contact_name}
                                    onChange={(v) => details.setData('contact_name', v)}
                                    error={details.errors.contact_name}
                                />
                                <TextField
                                    label="Role of Contact Person"
                                    required
                                    value={details.data.contact_role}
                                    onChange={(v) => details.setData('contact_role', v)}
                                    error={details.errors.contact_role}
                                />
                                <TextField
                                    label="Contact Number"
                                    required
                                    value={details.data.contact_phone}
                                    onChange={(v) => details.setData('contact_phone', v)}
                                    error={details.errors.contact_phone}
                                />
                            </div>
                            <p className="text-muted-foreground pt-2 text-xs font-medium tracking-wide uppercase">
                                Default account for investor payments
                            </p>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <TextField
                                    label="Bank Name"
                                    required
                                    value={details.data.bank_name}
                                    onChange={(v) => details.setData('bank_name', v)}
                                    error={details.errors.bank_name}
                                />
                                <TextField
                                    label="Account Name"
                                    required
                                    value={details.data.bank_account_name}
                                    onChange={(v) => details.setData('bank_account_name', v)}
                                    error={details.errors.bank_account_name}
                                />
                                <TextField
                                    label="Account Number"
                                    required
                                    placeholder="10-digit NUBAN"
                                    value={details.data.bank_account_number}
                                    onChange={(v) => details.setData('bank_account_number', v)}
                                    error={details.errors.bank_account_number}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={details.processing}>
                                    {registered ? 'Save Changes' : 'Submit Registration'}
                                </Button>
                            </div>
                        </form>
                    )}
                </Section>

                {feeEnabled && registered && invoice && (
                    <Section
                        className="[&_h2]:tracking-wide [&_h2]:uppercase"
                        title="Annual platform fee"
                        description={`Invoice ${invoice.reference} · ${formatDate(invoice.period_start)} to ${formatDate(invoice.period_end)}`}
                    >
                        <div className="space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-muted-foreground text-sm">Amount payable</p>
                                    <p className="text-navy text-3xl font-semibold dark:text-white">{formatMoney(invoice.amount)}</p>
                                    <p className="text-muted-foreground text-xs">Due {formatDate(invoice.due_date)}</p>
                                </div>
                                <StatusBadge map={feeStatus} value={invoice.status} />
                            </div>
                            {invoice.review_comment && <p className="text-sm text-rose-600">FMDQ: {invoice.review_comment}</p>}
                            {payable && (
                                <>
                                    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
                                        {Object.entries(gateways).map(([k, label]) => (
                                            <button
                                                type="button"
                                                key={k}
                                                role="radio"
                                                aria-checked={method === k}
                                                onClick={() => setMethod(k)}
                                                className={cn(
                                                    'flex items-center gap-2 rounded-lg border px-4 py-3 text-sm',
                                                    method === k ? 'border-navy bg-navy/5 font-medium' : 'hover:border-navy/40'
                                                )}
                                            >
                                                {k === 'bank_transfer' ? (
                                                    <Landmark className="size-4" />
                                                ) : (
                                                    <CreditCard className="size-4" />
                                                )}{' '}
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    {method === 'bank_transfer' ? (
                                        <form
                                            onSubmit={async (e) => {
                                                e.preventDefault();
                                                const confirmed = await confirmSubmit({
                                                    title: 'Submit Evidence of Payment?',
                                                    text: `FMDQ will confirm your ${formatMoney(invoice.amount)} transfer before activating the registration.`
                                                });
                                                if (!confirmed) return;
                                                transfer.post(route('tsp.registration.transfer', invoice.id), {
                                                    forceFormData: true,
                                                    preserveScroll: true
                                                });
                                            }}
                                            className="space-y-4"
                                        >
                                            <div className="bg-muted/50 rounded-lg border p-4">
                                                <DetailList
                                                    columns={3}
                                                    items={[
                                                        { label: 'Bank', value: bank.bank_name },
                                                        { label: 'Account Name', value: bank.account_name },
                                                        {
                                                            label: 'Account Number',
                                                            value: <span className="font-mono">{bank.account_number}</span>
                                                        }
                                                    ]}
                                                />
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <TextField
                                                    label="Transfer Reference"
                                                    value={transfer.data.reference}
                                                    onChange={(v) => transfer.setData('reference', v)}
                                                    error={transfer.errors.reference}
                                                />
                                                <FileField
                                                    label="Evidence of Payment"
                                                    required
                                                    file={transfer.data.evidence}
                                                    onChange={(f) => transfer.setData('evidence', f)}
                                                    error={transfer.errors.evidence}
                                                />
                                            </div>
                                            <Button type="submit" disabled={!transfer.data.evidence || transfer.processing}>
                                                Submit Evidence of Payment
                                            </Button>
                                        </form>
                                    ) : (
                                        <Button
                                            disabled={pay.processing}
                                            onClick={async () => {
                                                const confirmed = await confirmSubmit({
                                                    title: `Pay ${formatMoney(invoice.amount)}?`,
                                                    text: `You will be taken to ${gateways[method]} to complete the payment.`,
                                                    confirmText: 'Yes, Pay Now'
                                                });
                                                if (!confirmed) return;
                                                pay.transform(() => ({ method }));
                                                pay.post(route('tsp.registration.pay', invoice.id));
                                            }}
                                        >
                                            {pay.processing && <LoaderCircle className="size-4 animate-spin" />}
                                            Pay {formatMoney(invoice.amount)} with {gateways[method]}
                                        </Button>
                                    )}
                                    {(pay.errors as Record<string, string>).method && (
                                        <p className="text-sm text-rose-600">{(pay.errors as Record<string, string>).method}</p>
                                    )}
                                </>
                            )}
                            {invoice.status === 'pending_review' && (
                                <p className="text-muted-foreground text-sm">
                                    Payment received on {formatDateTime(invoice.paid_at)}; FMDQ is confirming it.
                                </p>
                            )}
                        </div>
                    </Section>
                )}

                {invoices.length > 0 && (
                    <Section className="[&_h2]:tracking-wide [&_h2]:uppercase" title="Payment history" flush>
                        <table className="w-full text-sm">
                            <thead className="bg-muted/60 text-muted-foreground text-left text-xs tracking-wide uppercase">
                                <tr>
                                    <th className="px-4 py-2.5">Invoice</th>
                                    <th className="px-4 py-2.5">Period</th>
                                    <th className="px-4 py-2.5 text-right">Amount</th>
                                    <th className="px-4 py-2.5">Status</th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((i) => (
                                    <tr key={i.id} className="border-b last:border-0">
                                        <td className="px-4 py-3 font-mono text-xs">{i.reference}</td>
                                        <td className="px-4 py-3">
                                            {formatDate(i.period_start)} – {formatDate(i.period_end)}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">{formatMoney(i.amount)}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge map={feeStatus} value={i.status} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {i.status === 'paid' && (
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={route('tsp.registration.receipt', i.id)}>
                                                        <ReceiptText className="size-4" /> Receipt
                                                    </Link>
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>
                )}
            </Page>
        </AppLayout>
    );
}
