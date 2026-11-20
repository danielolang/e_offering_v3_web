import { titleCase } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/app';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface StatCardProps {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
    icon?: LucideIcon;
    /** Legacy KPI cards alternate navy and gold; "plain" is a white card. */
    variant?: 'navy' | 'gold' | 'plain';
    href?: string;
}

const variants = {
    navy: 'bg-linear-to-br from-navy to-navy-dark text-white border-transparent shadow-[0_10px_24px_-12px_rgb(29_50_109/0.6)]',
    gold: 'bg-linear-to-br from-gold-light to-gold text-navy-dark border-transparent shadow-[0_10px_24px_-12px_rgb(199_157_81/0.7)]',
    plain: 'bg-card text-card-foreground before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-linear-to-r before:from-navy before:to-gold dark:before:from-primary',
};

export function StatCard({ label, value, hint, icon: Icon, variant = 'plain', href }: StatCardProps) {
    const body = (
        <div
            className={cn(
                'group relative h-full overflow-hidden rounded-xl border p-5 shadow-xs transition duration-200',
                variants[variant],
                href && 'hover:-translate-y-0.5 hover:shadow-md',
            )}
        >
            {variant !== 'plain' && (
                <span aria-hidden className="pointer-events-none absolute -right-8 -bottom-10 size-28 rounded-full border-[14px] border-white/15" />
            )}
            <div className={cn('flex items-start justify-between gap-3 text-sm font-medium', variant === 'plain' ? 'text-muted-foreground' : 'text-current/85')}>
                {/* Card labels are title case app-wide, whatever the page passes. */}
                <span>{titleCase(label)}</span>
                {href ? <ArrowUpRight className="size-4 opacity-70" /> : Icon && <Icon className="size-4 opacity-80" />}
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums md:text-[28px]">{value}</div>
            {hint && <div className={cn('mt-1 text-xs', variant === 'plain' ? 'text-muted-foreground' : 'text-current/75')}>{hint}</div>}
        </div>
    );

    return href ? (
        <Link href={href} className="block h-full focus-visible:outline-none">
            {body}
        </Link>
    ) : (
        body
    );
}
