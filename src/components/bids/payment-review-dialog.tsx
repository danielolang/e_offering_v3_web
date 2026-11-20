import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@/lib/app';
import { formatDateTime, formatMoney } from '@/lib/format';
import { type Bid } from '@/types';
import { ArrowLeft, CheckCircle2, ClipboardCheck, ExternalLink, FileText, LoaderCircle, XCircle } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

/**
 * One "Review Payment" button per bid: the dialog shows the payment details and the evidence,
 * then Approve (status Paid) or Reject (status Invalid, comment mandatory) the payment.
 */
export function PaymentReviewDialog({ bid }: { bid: Bid }) {
    const [open, setOpen] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const form = useForm<{ valid: boolean; comment: string }>({ valid: true, comment: '' });
    const errors = form.errors as Record<string, string>;
    const isImage = /\.(png|jpe?g)(\?|$)/i.test(bid.evidence_url ?? '');

    const close = (value: boolean) => {
        setOpen(value);
        if (!value) {
            setRejecting(false);
            form.reset();
            form.clearErrors();
        }
    };

    const decide = (valid: boolean) => (e?: FormEvent) => {
        e?.preventDefault();
        form.transform(() => ({ valid, comment: valid ? '' : form.data.comment }));
        form.post(route('tsp.bids.payment', bid.id), { preserveScroll: true, onSuccess: () => close(false) });
    };

    const rows: [string, ReactNode][] = [
        ['Investor', bid.investor_name],
        ['Bid Reference', <span className="font-mono">{bid.reference}</span>],
        ['Amount', <span className="font-semibold">{formatMoney(bid.amount)}</span>],
        ['Paid To', bid.payee_name],
        ['Payment Reference', bid.payment_reference || '—'],
        ['Evidence Uploaded', bid.payment_uploaded_at ? formatDateTime(bid.payment_uploaded_at) : '—']
    ];

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogTrigger asChild>
                <Button size="sm" variant={bid.has_evidence ? 'default' : 'outline'}>
                    <ClipboardCheck className="size-4" /> Review Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{rejecting ? 'Reject Payment' : 'Review Payment'}</DialogTitle>
                    <DialogDescription>
                        {rejecting
                            ? 'The payment is marked Invalid and the investor is notified with your comment, so they can pay again.'
                            : 'Check the evidence against your account, then approve or reject the payment.'}
                    </DialogDescription>
                </DialogHeader>

                {!rejecting ? (
                    <div className="space-y-4">
                        <dl className="bg-muted/40 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-4 text-sm">
                            {rows.map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{label}</dt>
                                    <dd className="mt-0.5 break-words">{value}</dd>
                                </div>
                            ))}
                        </dl>
                        {bid.evidence_url ? (
                            <a
                                href={bid.evidence_url}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:border-navy/40 block overflow-hidden rounded-lg border transition"
                            >
                                {isImage ? (
                                    <img
                                        src={bid.evidence_url}
                                        alt="Evidence of payment"
                                        className="bg-muted/40 max-h-56 w-full object-contain"
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-4 text-sm">
                                        <FileText className="text-gold size-8 shrink-0" />
                                        <span className="font-medium">Evidence of Payment</span>
                                    </div>
                                )}
                                <span className="text-navy dark:text-gold-light flex items-center justify-center gap-1.5 border-t py-2 text-xs font-medium">
                                    <ExternalLink className="size-3.5" /> Open in a New Tab
                                </span>
                            </a>
                        ) : (
                            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                                The investor has not uploaded evidence of payment yet.
                            </p>
                        )}
                        {(errors.valid || errors.payment) && <p className="text-destructive text-sm">{errors.valid ?? errors.payment}</p>}
                    </div>
                ) : (
                    <form id={`reject-${bid.id}`} onSubmit={decide(false)} className="space-y-2">
                        <Label htmlFor={`reject-comment-${bid.id}`}>
                            Comment <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id={`reject-comment-${bid.id}`}
                            rows={4}
                            required
                            autoFocus
                            placeholder="e.g. No matching credit found for this reference."
                            value={form.data.comment}
                            onChange={(e) => form.setData('comment', e.target.value)}
                        />
                        {errors.comment && <p className="text-destructive text-sm">{errors.comment}</p>}
                    </form>
                )}

                <DialogFooter className="gap-2 sm:justify-between">
                    {!rejecting ? (
                        <>
                            <Button type="button" variant="outline" onClick={() => close(false)}>
                                Cancel
                            </Button>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-gold text-gold hover:bg-gold/10 hover:text-gold border bg-transparent"
                                    disabled={form.processing}
                                    onClick={() => setRejecting(true)}
                                >
                                    <XCircle className="size-4" /> Reject
                                </Button>
                                <Button
                                    type="button"
                                    disabled={form.processing}
                                    onClick={() => decide(true)()}
                                    className="from-navy to-navy-dark ring-gold/40 hover:ring-gold bg-linear-to-br text-white shadow-sm ring-1 hover:brightness-110"
                                >
                                    {form.processing ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="size-4" />
                                    )}
                                    Approve
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Button type="button" variant="outline" onClick={() => setRejecting(false)}>
                                <ArrowLeft className="size-4" /> Back
                            </Button>
                            <Button
                                type="submit"
                                form={`reject-${bid.id}`}
                                variant="outline"
                                className="border-gold text-gold hover:bg-gold/10 hover:text-gold border bg-transparent"
                                disabled={form.processing || !form.data.comment.trim()}
                            >
                                {form.processing ? <LoaderCircle className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                                Reject Payment
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
