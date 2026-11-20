import { asset } from '@/lib/url';

/** FMDQ logo with the platform name under it; collapses to a compact monogram with the sidebar. */
export default function AppLogo() {
    return (
        <div className="flex w-full min-w-0 items-center justify-center">
            {/* Icon-only sidebar: the wordmark is too wide, so a monogram stands in for it. */}
            <div className="from-gold-light to-gold text-navy-dark hidden size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br text-xs font-extrabold shadow-sm group-data-[collapsible=icon]:flex">
                FM
            </div>
            <div className="flex min-w-0 flex-col items-center gap-1.5 group-data-[collapsible=icon]:hidden">
                {/* The logo artwork is dark-on-white, so it sits on a white chip against the navy rail. */}
                <div className="flex shrink-0 items-center rounded-lg bg-white px-3 py-1.5 shadow-sm ring-1 ring-white/20">
                    <img src={asset('images/fmdq-logo.svg')} alt="FMDQ" className="h-6 w-auto" />
                </div>
                <div className="flex items-baseline gap-1.5 leading-none whitespace-nowrap">
                    <span className="text-[13px] font-semibold text-white">e-Offering</span>
                    <span className="text-gold-light text-[9px] font-bold tracking-[0.18em] uppercase">Platform</span>
                </div>
            </div>
        </div>
    );
}
