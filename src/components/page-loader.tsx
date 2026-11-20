import { asset } from '@/lib/url';

/**
 * Full-page loader shown while a screen's code or data loads: the FMDQ logo inside a
 * navy-to-gold spinning ring, the platform name and a sliding progress bar. It fades in
 * after a short delay so quick loads don't flash it.
 */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
    return (
        <div role="status" aria-live="polite" className="eo-loader flex min-h-svh flex-col items-center justify-center gap-6 p-6">
            <div className="relative flex size-28 items-center justify-center">
                {/* Soft glow behind the ring. */}
                <div className="bg-gold/20 absolute inset-2 animate-pulse rounded-full blur-xl" />
                {/* Spinning gradient arc. */}
                <div className="eo-loader-ring absolute inset-0 animate-spin rounded-full" />
                <div className="relative flex size-[5.5rem] items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5">
                    <img src={asset('images/fmdq-logo.svg')} alt="FMDQ" className="h-6 w-auto" />
                </div>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-navy text-sm font-semibold dark:text-white">e-Offering Platform</p>
                <p className="text-muted-foreground text-xs">
                    {label}
                    <span className="eo-loader-dots" aria-hidden />
                </p>
            </div>
            <div className="bg-muted h-1 w-48 overflow-hidden rounded-full">
                <div className="eo-loader-bar from-navy to-gold h-full w-1/3 rounded-full bg-linear-to-r dark:from-sky-400" />
            </div>
        </div>
    );
}
