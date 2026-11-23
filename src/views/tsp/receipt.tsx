import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { paymentMethod } from '@/lib/labels';
import { type FeeInvoice } from '@/types';
import { Head, Link } from '@/lib/app';
import { ArrowLeft, Download, Printer } from 'lucide-react';

/** Printable platform-fee receipt (CR s3.2 step 9). "Print" saves it as a PDF. */
export default function Receipt({ invoice }: { invoice: FeeInvoice }) {
    const rows: [string, string][] = [
        ['Receipt for invoice', invoice.reference],
        ['Received from', invoice.institution?.name ?? ''],
        ['Description', `Annual e-offering platform fee, ${formatDate(invoice.period_start)} to ${formatDate(invoice.period_end)}`],
        ['Payment method', paymentMethod(invoice.method)],
        ['Payment reference', invoice.gateway_reference ?? '—'],
        ['Paid on', invoice.paid_at ? formatDateTime(invoice.paid_at) : '—'],
        ['Confirmed by FMDQ', invoice.reviewed_at ? `${formatDateTime(invoice.reviewed_at)}${invoice.reviewer ? ` (${invoice.reviewer.name})` : ''}` : '—'],
    ];

    return (
        <div className="bg-muted/40 min-h-svh p-6 print:bg-white print:p-0">
            <Head title={`Receipt ${invoice.reference}`} />
            <div className="mx-auto mb-4 flex max-w-2xl justify-between items-center print:hidden">
                <Button variant="outline" asChild>
                    <Link href={route('tsp.registration.show')}>
                        <ArrowLeft className="size-4" /> Back
                    </Link>
                </Button>
                <div className="flex items-center gap-2">
                    {(invoice.receipt_pdf_url || invoice.gateway_reference) && (
                        <Button variant="outline" asChild>
                            <a
                                href={invoice.receipt_pdf_url || route('tsp.registration.receipt-pdf', invoice.id)}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Download className="size-4" /> Download Official Receipt (PDF)
                            </a>
                        </Button>
                    )}
                    <Button onClick={() => window.print()}>
                        <Printer className="size-4" /> Print / Save as PDF
                    </Button>
                </div>
            </div>
            <div className="mx-auto max-w-2xl overflow-hidden rounded-xl border bg-white text-[#1f2937] shadow-sm print:border-0 print:shadow-none">
                <div className="flex items-center justify-between border-b-4 border-[#c79d51] p-8">
                    <AppLogoIcon className="h-10" />
                    <div className="text-right">
                        <p className="text-xl font-semibold text-[#1d326d]">PAYMENT RECEIPT</p>
                        <p className="text-sm text-gray-500">FMDQ e-offering Platform</p>
                    </div>
                </div>
                <div className="p-8">
                    <table className="w-full text-sm">
                        <tbody>
                            {rows.map(([k, v]) => (
                                <tr key={k} className="border-b last:border-0">
                                    <td className="w-48 py-2.5 text-gray-500">{k}</td>
                                    <td className="py-2.5 font-medium capitalize">{v}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-8 flex items-center justify-between rounded-lg bg-[#1d326d] px-6 py-4 text-white">
                        <span>Amount paid</span>
                        <span className="text-2xl font-semibold">{formatMoney(invoice.amount)}</span>
                    </div>
                </div>
                <p className="bg-[#1a2744] px-8 py-3 text-center text-xs text-[#e3c87a] italic">
                    {/* FMDQ Depository Limited is registered and regulated by the Securities and Exchange Commission, Nigeria */}
                </p>
            </div>
        </div>
    );
}
