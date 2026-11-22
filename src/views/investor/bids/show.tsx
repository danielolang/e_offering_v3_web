import { confirmSubmit } from '@/lib/alert';
import { DecisionDialog } from '@/components/decision-dialog';
import { FileField, TextField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { DetailList, Page, Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime, formatMoney, formatNumber, formatRate } from '@/lib/format';
import { allotmentStatus, bidStatus, paymentStatus } from '@/lib/labels';
import { type Bid } from '@/types';
import { Head, Link, useForm } from '@/lib/app';
import { CreditCard, FileText, Info, LoaderCircle, PencilLine, Printer, ReceiptText } from 'lucide-react';
import { CommitmentSheet, type CommitmentValues } from '@/components/bids/commitment-sheet';

interface Props {
    bid: Bid;
    canChange: boolean;
    canUploadEvidence: boolean;
    /** QPay is offered once FMDQ has a service code for subscription payments. */
    qpayEnabled?: boolean;
    /** Evidence is with the sponsor: paying again is disabled unless it is marked Invalid. */
    awaitingReview?: boolean;
    /** Co-sponsors listed on the offer, for the commitment form. */
    coSponsors?: string[];
    allotment: { allotted: string; units: string; released: string; filled_pct: string } | null;
    allotmentStatus: string | null;
}

const actionLabel: Record<string, string> = {
    submitted: 'Bid submitted',
    amended: 'Bid amended',
    revoked: 'Bid revoked',
    payment_uploaded: 'Evidence of payment uploaded',
    payment_valid: 'Payment confirmed (Paid)',
    payment_invalid: 'Payment marked Invalid',
    payment_qpay_started: 'Sent to QPay to pay online',
    payment_qpay_paid: 'Paid online with QPay'
};

/** Bid status, payment and full history (CR s6.1 steps 3-4, s6.2). */
export default function BidShow({
    bid,
    canChange,
    canUploadEvidence,
    qpayEnabled = false,
    awaitingReview = false,
    coSponsors = [],
    allotment,
    allotmentStatus: aStatus
}: Props) {
    const offer = bid.offer!;
    const upload = useForm<{ evidence: File | null; payment_reference: string }>({
        evidence: null,
        payment_reference: bid.payment_reference ?? ''
    });
    const qpay = useForm({});
    const payOnline = async () => {
        const confirmed = await confirmSubmit({
            title: `Pay ${formatMoney(bid.amount)}?`,
            text: 'You will be taken to QPay to pay for this bid. When QPay confirms, the payment is recorded against your bid automatically.',
            confirmText: 'Yes, Pay Now'
        });
        if (confirmed) qpay.post(route('investor.bids.qpay', bid.id));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'My Bids', href: route('investor.history') },
                { title: bid.reference, href: route('investor.bids.show', bid.id) }
            ]}
        >
            <Head title={bid.reference} />
            <Page className="max-w-5xl">
                <PageHeader
                    title={offer.issuer_name}
                    description={
                        <span className="flex flex-wrap items-center gap-2">
                            Bid {bid.reference} <StatusBadge map={bidStatus} value={bid.status} />{' '}
                            <StatusBadge map={paymentStatus} value={bid.payment_status} />
                        </span>
                    }
                    actions={
                        canChange && (
                            <>
                                <DecisionDialog
                                    href={route('investor.bids.revoke', bid.id)}
                                    title="Revoke This Bid"
                                    description="The bid is withdrawn from the order book. You can place a new bid while the offer is open."
                                    trigger="Revoke Bid"
                                    triggerVariant="outline"
                                    destructive
                                    confirmLabel="Revoke"
                                />
                                <Button asChild>
                                    <Link href={route('investor.bids.edit', bid.id)}>
                                        <PencilLine className="size-4" /> Amend Bid
                                    </Link>
                                </Button>
                            </>
                        )
                    }
                />
                <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
                    <Info className="mt-0.5 size-4 shrink-0" />
                    Your bid has been received. Submitting a bid does not guarantee allocation or allotment. Payment shows as “Pending”
                    until the sponsor confirms it, or until QPay confirms an online payment.
                </div>

                {allotment && (
                    <Section title="Allotment outcome" description={<StatusBadge map={allotmentStatus} value={aStatus} />}>
                        <DetailList
                            columns={4}
                            items={[
                                {
                                    label: 'Amount allotted',
                                    value: <span className="text-lg font-semibold">{formatMoney(allotment.allotted)}</span>
                                },
                                { label: 'Units allotted', value: formatNumber(allotment.units, 4) },
                                { label: 'Amount released', value: formatMoney(allotment.released) },
                                { label: '% of subscription filled', value: `${Number(allotment.filled_pct)}%` }
                            ]}
                        />
                    </Section>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                    <Section title="Bid details">
                        <DetailList
                            items={[
                                { label: 'Amount', value: formatMoney(bid.amount) },
                                {
                                    label: offer.rate_label,
                                    value: bid.rate ? formatRate(bid.rate, offer.security_type === 'equities' ? '' : '%') : 'Fixed'
                                },
                                { label: 'Investor type', value: bid.investor_type_label },
                                { label: 'Submitted', value: formatDateTime(bid.submitted_at) },
                                { label: 'CSD account', value: `${bid.csd_name ?? ''} ${bid.csd_account_number ?? ''}` },
                                { label: 'Refund account', value: `${bid.bank_name} · ${bid.bank_account_number}` }
                            ]}
                        />
                    </Section>
                    <Section title="Payment">
                        <div className="space-y-4">
                            <DetailList
                                items={[
                                    { label: 'Pay to', value: bid.payee_name },
                                    {
                                        label: 'Account',
                                        value: `${bid.payee_bank_name ?? ''} · ${bid.payee_account_name ?? ''} · ${bid.payee_account_number ?? ''}`
                                    },
                                    { label: 'Reference', value: bid.payment_reference },
                                    {
                                        label: 'Evidence',
                                        value: bid.evidence_url ? (
                                            <a href={bid.evidence_url} target="_blank" rel="noreferrer" className="underline">
                                                View uploaded evidence
                                            </a>
                                        ) : (
                                            'Not uploaded'
                                        )
                                    },
                                    ...(bid.invoice_pdf_url || bid.payment_gateway_reference
                                        ? [
                                              {
                                                  label: 'Payment Invoice',
                                                  value: (
                                                      <a
                                                          href={bid.invoice_pdf_url || route('investor.bids.invoice-pdf', bid.id)}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className="inline-flex items-center gap-1.5 font-medium text-navy hover:underline dark:text-blue-400"
                                                      >
                                                          <FileText className="size-3.5" />
                                                          Download Invoice (PDF)
                                                      </a>
                                                  )
                                              }
                                          ]
                                        : []),
                                    ...(bid.payment_status === 'paid' && (bid.receipt_pdf_url || bid.payment_gateway_reference)
                                        ? [
                                              {
                                                  label: 'Payment Receipt',
                                                  value: (
                                                      <a
                                                          href={bid.receipt_pdf_url || route('investor.bids.receipt-pdf', bid.id)}
                                                          target="_blank"
                                                          rel="noreferrer"
                                                          className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                                                      >
                                                          <ReceiptText className="size-3.5" />
                                                          Download Receipt (PDF)
                                                      </a>
                                                  )
                                              }
                                          ]
                                        : [])
                                ]}
                            />
                            {bid.payment_status === 'invalid' && bid.payment_comment && (
                                <p className="text-sm text-rose-600">Sponsor comment: {bid.payment_comment}</p>
                            )}
                            {canUploadEvidence && awaitingReview && (
                                <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                    <Info className="mt-0.5 size-4 shrink-0" />
                                    Your evidence of payment is with the sponsor for review. Paying again is available only if it is marked
                                    Invalid.
                                </p>
                            )}
                            {canUploadEvidence && qpayEnabled && (
                                <div className="from-navy/[0.06] dark:from-primary/10 flex flex-col items-center gap-3 rounded-lg border bg-linear-to-b to-transparent p-4 text-center">
                                    <div className="text-sm">
                                        <p className="font-medium">Pay online with QPay</p>
                                        <p className="text-muted-foreground text-xs">Recorded against your bid as soon as QPay confirms.</p>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={awaitingReview || qpay.processing}
                                        onClick={() => void payOnline()}
                                    >
                                        {qpay.processing ? (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        ) : (
                                            <CreditCard className="size-4" />
                                        )}{' '}
                                        Pay {formatMoney(bid.amount)}
                                    </Button>
                                </div>
                            )}
                            {canUploadEvidence && qpayEnabled && (
                                <p className="text-muted-foreground text-center text-xs">or pay by bank transfer and upload the evidence</p>
                            )}
                            {canUploadEvidence && (
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        if (awaitingReview) return;
                                        if (
                                            !(await confirmSubmit({
                                                title: 'Submit Evidence of Payment?',
                                                text: 'The Transaction Sponsor will review it to confirm your payment.'
                                            }))
                                        )
                                            return;
                                        upload.post(route('investor.bids.evidence', bid.id), {
                                            forceFormData: true,
                                            preserveScroll: true,
                                            onSuccess: () => upload.reset('evidence')
                                        });
                                    }}
                                    className={`space-y-3 rounded-lg border border-dashed p-3 ${awaitingReview ? 'opacity-60' : ''}`}
                                >
                                    <TextField
                                        label="Payment Reference"
                                        disabled={awaitingReview}
                                        value={upload.data.payment_reference}
                                        onChange={(v) => upload.setData('payment_reference', v)}
                                    />
                                    <FileField
                                        label={bid.has_evidence ? 'Replace evidence' : 'Upload evidence of payment'}
                                        required
                                        disabled={awaitingReview}
                                        file={upload.data.evidence}
                                        onChange={(f) => upload.setData('evidence', f)}
                                        error={upload.errors.evidence}
                                    />
                                    <Button type="submit" size="sm" disabled={awaitingReview || !upload.data.evidence || upload.processing}>
                                        Upload
                                    </Button>
                                </form>
                            )}
                        </div>
                    </Section>
                </div>

                {/* The submitted Standardised Commitment Form, exactly as the legacy platform showed it. */}
                <Section
                    title="Commitment Form"
                    description="Your Standardised Commitment Form as submitted."
                    flush
                    actions={
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                document.getElementById('commitment-sheet')?.classList.add('lcf-printing');
                                window.print();
                                document.getElementById('commitment-sheet')?.classList.remove('lcf-printing');
                            }}
                        >
                            <Printer className="size-4" /> Print
                        </Button>
                    }
                >
                    <div id="commitment-sheet">
                        <CommitmentSheet
                            offer={offer}
                            values={{
                                ...((bid.commitment ?? {}) as Partial<CommitmentValues>),
                                date: bid.submitted_at,
                                investor_type: bid.investor_type,
                                orders: (bid.commitment?.orders ?? []).length
                                    ? (bid.commitment?.orders ?? []).map((o) => ({ amount: o.amount, rate: o.rate ?? bid.rate }))
                                    : [{ amount: bid.amount, rate: bid.rate }],
                                bank_name: bid.bank_name,
                                bank_account_name: bid.bank_account_name,
                                bank_account_number: bid.bank_account_number,
                                clearing_house_no:
                                    (bid.commitment?.clearing_house_no as string | undefined) ??
                                    (/cscs/i.test(bid.csd_name ?? '') ? bid.csd_account_number : null),
                                sponsor: bid.payee_name,
                                co_sponsors: coSponsors
                            }}
                            images={bid.commitment_files ?? {}}
                        />
                    </div>
                </Section>

                <Section title="History">
                    <ol className="space-y-3">
                        {(bid.events ?? []).map((e) => (
                            <li key={e.id} className="border-gold border-l-2 pl-3 text-sm">
                                <p className="font-medium">{actionLabel[e.action] ?? e.action}</p>
                                {e.action === 'amended' && e.before && e.after && (
                                    <p className="text-muted-foreground text-xs">
                                        {Object.keys(e.after)
                                            .filter((k) => String(e.before![k] ?? '') !== String(e.after![k] ?? ''))
                                            .map((k) => `${k.replace(/_/g, ' ')}: ${e.before![k] ?? '—'} → ${e.after![k] ?? '—'}`)
                                            .join('; ')}
                                    </p>
                                )}
                                {e.comment && <p className="text-muted-foreground text-xs">{e.comment}</p>}
                                <p className="text-muted-foreground text-xs">
                                    {e.user?.name} · {formatDateTime(e.created_at)}
                                </p>
                            </li>
                        ))}
                    </ol>
                </Section>
            </Page>
        </AppLayout>
    );
}
