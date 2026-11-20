import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { check, EMAIL, type Errors, rules } from '@/lib/validation';
import { CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';

export type OnboardUser = {
    name: string;
    email: string;
    access_level: 'inputter' | 'authoriser';
};

/**
 * Authorised users with an Inputter / Authoriser access level. Submission needs at least
 * one of each (CR s3.2 step 3); the checklist makes that visible before submitting.
 */
export function UsersEditor({
    users,
    onChange,
    errors,
    onBlur
}: {
    users: OnboardUser[];
    onChange: (users: OnboardUser[]) => void;
    errors: Record<string, string>;
    /** Called with the field key (e.g. "users.0.email") when a box loses focus. */
    onBlur?: (field: string) => void;
}) {
    const set = (i: number, patch: Partial<OnboardUser>) => onChange(users.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));
    const hasInputter = users.some((u) => u.access_level === 'inputter');
    const hasAuthoriser = users.some((u) => u.access_level === 'authoriser');
    const field = (i: number, key: keyof OnboardUser) => {
        const name = `users.${i}.${key}`;
        return { error: errors[name], onBlur: () => onBlur?.(name) };
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-xs">
                {[
                    ['At least one Inputter', hasInputter],
                    ['At least one Authoriser', hasAuthoriser]
                ].map(([label, ok]) => (
                    <span key={String(label)} className={`flex items-center gap-1 ${ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {ok ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />} {label}
                    </span>
                ))}
            </div>
            {users.map((u, i) => {
                const name = field(i, 'name');
                const email = field(i, 'email');
                return (
                    <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_0.9fr_auto] sm:items-start">
                        <div>
                            <Input
                                placeholder="Full Name"
                                value={u.name}
                                onChange={(e) => set(i, { name: e.target.value })}
                                onBlur={name.onBlur}
                                aria-invalid={!!name.error}
                                aria-label={`User ${i + 1} name`}
                                required
                            />
                            <InputError message={name.error} />
                        </div>
                        <div>
                            <Input
                                type="email"
                                placeholder="Email Address"
                                value={u.email}
                                onChange={(e) => set(i, { email: e.target.value })}
                                onBlur={email.onBlur}
                                aria-invalid={!!email.error}
                                aria-label={`User ${i + 1} email`}
                                required
                            />
                            <InputError message={email.error} />
                        </div>
                        <select
                            value={u.access_level}
                            onChange={(e) => set(i, { access_level: e.target.value as OnboardUser['access_level'] })}
                            aria-label={`User ${i + 1} access level`}
                            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
                        >
                            <option value="inputter">Inputter</option>
                            <option value="authoriser">Authoriser</option>
                        </select>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={users.length <= 2}
                            onClick={() => onChange(users.filter((_, idx) => idx !== i))}
                            aria-label="Remove user"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                );
            })}
            <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={users.length >= 20}
                onClick={() => onChange([...users, { name: '', email: '', access_level: 'inputter' }])}
            >
                <Plus className="size-4" /> Add User
            </Button>
            <InputError message={errors.users} />
        </div>
    );
}

/** Client-side mirror of the API's userRules(), keyed like its errors ("users.1.email"). */
export function usersErrors(users: OnboardUser[]): Errors {
    const errors: Errors = {};
    const seen = new Set<string>();

    users.forEach((u, i) => {
        Object.assign(
            errors,
            check({
                [`users.${i}.name`]: [u.name, rules.required("Enter the user's full name."), rules.max(191)],
                [`users.${i}.email`]: [u.email, rules.required("Enter the user's email address."), rules.email(), rules.max(191)]
            })
        );
        // API rule 'distinct': the same email cannot be used for two users.
        const email = u.email.trim().toLowerCase();
        if (email && !errors[`users.${i}.email`] && seen.has(email))
            errors[`users.${i}.email`] = 'This email is already used for another user.';
        if (email) seen.add(email);
    });

    if (users.length < 2) errors.users = 'Add at least two users.';
    else if (!users.some((u) => u.access_level === 'inputter') || !users.some((u) => u.access_level === 'authoriser'))
        errors.users = 'Add at least one Inputter and one Authoriser.';

    return errors;
}

/** True when the users list would pass the API's rules. */
export const usersComplete = (users: OnboardUser[]): boolean => Object.keys(usersErrors(users)).length === 0;

export const isEmail = (value: string) => EMAIL.test(value.trim());

export const defaultUsers: OnboardUser[] = [
    { name: '', email: '', access_level: 'inputter' },
    { name: '', email: '', access_level: 'authoriser' }
];
