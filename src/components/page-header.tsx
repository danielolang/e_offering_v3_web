import { type ReactNode } from 'react';

/**
 * Page banner: navy brand panel with the title, description and page actions.
 * Inside it the primary colour is gold, so default buttons stay visible on navy.
 */
export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
    return (
        <div className="relative isolate overflow-hidden rounded-2xl bg-linear-to-b from-[hsl(224_58%_17%)] to-[hsl(224_60%_11%)] px-5 py-5 text-white shadow-[0_14px_34px_-16px_hsl(224_60%_11%/0.8)] sm:px-7 sm:py-6 dark:ring-1 dark:ring-white/10">
            {/* Decoration only: faint grid, a ring and a slow-pulsing gold glow. */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_left,black,transparent_75%)] [background-size:28px_28px] opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)]"
            />
            <span aria-hidden className="pointer-events-none absolute -top-20 -right-12 -z-10 size-60 rounded-full border-[28px] border-white/[0.06]" />
            <span
                aria-hidden
                className="bg-gold/30 pointer-events-none absolute right-1/4 -bottom-24 -z-10 size-48 animate-pulse rounded-full blur-3xl [animation-duration:5s]"
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 gap-3.5">
                    <span aria-hidden className="from-gold-light to-gold w-1 shrink-0 rounded-full bg-linear-to-b" />
                    <div className="min-w-0 space-y-1 py-0.5">
                        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                        {description && <div className="text-sm text-white/75">{description}</div>}
                    </div>
                </div>
                {actions && (
                    <div className="text-foreground flex flex-wrap items-center gap-2 [--color-primary-foreground:var(--color-navy-dark)] [--color-primary:var(--color-gold)]">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
