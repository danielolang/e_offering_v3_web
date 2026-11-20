import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';

export interface WizardStep {
    title: string;
    /** Small counter beside the title, e.g. "1/2" documents or "3 changed". */
    badge?: ReactNode;
}

/**
 * Step bar for multi-step forms (Create Offer, Amend Offer): numbered steps with a tick when
 * done, "!" when a step holds an error, and a progress line. Steps up to `reached` can be
 * opened directly. It scrolls sideways on narrow screens with the scrollbar hidden, so it
 * keeps the current step in view.
 */
export function WizardSteps({
    steps,
    current,
    reached,
    errorSteps,
    onSelect
}: {
    steps: WizardStep[];
    current: number;
    reached: number;
    errorSteps?: Set<number>;
    onSelect: (index: number) => void;
}) {
    const bar = useRef<HTMLOListElement>(null);
    useEffect(() => {
        const el = bar.current;
        const item = el?.querySelector<HTMLElement>(`[data-step="${current}"]`);
        if (el && item) el.scrollTo({ left: item.offsetLeft - (el.clientWidth - item.offsetWidth) / 2, behavior: 'smooth' });
    }, [current]);

    return (
        <nav aria-label="Steps" className="bg-card rounded-xl border p-3 shadow-xs">
            <ol ref={bar} className="relative flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {steps.map((s, i) => {
                    const done = i < current;
                    const hasError = errorSteps?.has(i) ?? false;
                    return (
                        <li key={s.title} className="flex items-center gap-1" data-step={i}>
                            <button
                                type="button"
                                onClick={() => onSelect(i)}
                                disabled={i > reached}
                                aria-current={i === current ? 'step' : undefined}
                                className={cn(
                                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition disabled:cursor-not-allowed',
                                    i === current
                                        ? 'bg-navy/[0.07] text-navy dark:bg-primary/15 font-semibold dark:text-white'
                                        : 'hover:bg-muted',
                                    i > reached && 'text-muted-foreground hover:bg-transparent'
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                                        hasError
                                            ? 'bg-rose-500 text-white'
                                            : i === current
                                              ? 'bg-navy dark:bg-primary dark:text-primary-foreground text-white'
                                              : done
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-muted text-muted-foreground ring-border ring-1'
                                    )}
                                >
                                    {hasError ? '!' : done ? <Check className="size-3.5" /> : i + 1}
                                </span>
                                <span className="whitespace-nowrap">{s.title}</span>
                                {s.badge !== undefined && s.badge !== null && s.badge !== false && (
                                    <span className="bg-gold/15 text-navy-dark dark:text-gold-light rounded-full px-1.5 text-[10px] font-semibold whitespace-nowrap">
                                        {s.badge}
                                    </span>
                                )}
                            </button>
                            {i < steps.length - 1 && <span aria-hidden className="bg-border h-px w-4 shrink-0" />}
                        </li>
                    );
                })}
            </ol>
            <div className="bg-muted mt-3 h-1 overflow-hidden rounded-full">
                <div
                    className="from-navy to-gold h-full rounded-full bg-linear-to-r transition-all duration-300"
                    style={{ width: `${((current + 1) / steps.length) * 100}%` }}
                />
            </div>
        </nav>
    );
}
