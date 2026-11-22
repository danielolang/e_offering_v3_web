import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Browsers let a number input take "e", "+" and "-" (scientific notation), so `1e5` or `--`
 * could be typed or pasted. Number fields here take digits and one decimal point only; a
 * minus sign is allowed only where the field opts into negatives with a `min` below zero.
 */
const allowsNegative = (min: React.ComponentProps<'input'>['min']) => min !== undefined && min !== '' && Number(min) < 0;

const numberPattern = (negative: boolean) => (negative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
    ({ className, type, onKeyDown, onPaste, onDrop, ...props }, ref) => {
        const numeric = type === 'number';
        const digitsOnly = props.inputMode === 'numeric' || props.pattern === '[0-9]*';
        const negative = numeric && allowsNegative(props.min);

        return (
            <input
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-muted/50 read-only:cursor-not-allowed read-only:text-muted-foreground md:text-sm aria-invalid:border-rose-400 aria-invalid:focus-visible:ring-rose-400/50',
                    className
                )}
                ref={ref}
                onKeyDown={(e) => {
                    if (numeric && !e.ctrlKey && !e.metaKey && (['e', 'E', '+'].includes(e.key) || (e.key === '-' && !negative))) {
                        e.preventDefault();
                    }
                    if (digitsOnly && !e.ctrlKey && !e.metaKey && e.key.length === 1 && !/^\d$/.test(e.key)) {
                        e.preventDefault();
                    }
                    onKeyDown?.(e);
                }}
                onPaste={(e) => {
                    if (numeric && !numberPattern(negative).test(e.clipboardData.getData('text').trim())) {
                        e.preventDefault();
                    }
                    if (digitsOnly && !/^\d*$/.test(e.clipboardData.getData('text').trim())) {
                        e.preventDefault();
                    }
                    onPaste?.(e);
                }}
                onDrop={(e) => {
                    if (numeric && !numberPattern(negative).test(e.dataTransfer.getData('text').trim())) {
                        e.preventDefault();
                    }
                    if (digitsOnly && !/^\d*$/.test(e.dataTransfer.getData('text').trim())) {
                        e.preventDefault();
                    }
                    onDrop?.(e);
                }}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';

export { Input };
