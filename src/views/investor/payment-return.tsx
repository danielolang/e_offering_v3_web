import { Page } from '@/components/section';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@/lib/app';
import { LoaderCircle } from 'lucide-react';

/**
 * Where QPay returns the investor after paying for a bid. The route confirms the payment with
 * the API on arrival and then opens the bid; this screen only shows while that happens.
 */
export default function PaymentReturn() {
    return (
        <AppLayout breadcrumbs={[{ title: 'My Bids', href: route('investor.history') }]}>
            <Head title="Confirming payment" />
            <Page className="mx-auto w-full max-w-xl">
                <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border p-10 text-center shadow-xs">
                    <LoaderCircle className="text-navy dark:text-gold-light size-8 animate-spin" />
                    <h1 className="text-navy text-lg font-semibold dark:text-white">Confirming your QPay payment…</h1>
                    <p className="text-muted-foreground text-sm">This takes a moment. Your bid opens as soon as the payment is recorded.</p>
                    <Button variant="outline" size="sm" asChild className="mt-2">
                        <Link href={route('investor.history')}>Go to My Bids</Link>
                    </Button>
                </div>
            </Page>
        </AppLayout>
    );
}
