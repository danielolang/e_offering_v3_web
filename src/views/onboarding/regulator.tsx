import { Field, TextField } from '@/components/form-field';
import { ConsentNotice } from '@/components/onboarding/consent';
import { Button } from '@/components/ui/button';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { confirmSubmit } from '@/lib/alert';
import { Head, Link, useForm } from '@/lib/app';
import { cn } from '@/lib/utils';
import { check, rules, useLiveValidation } from '@/lib/validation';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

const CONSENT = 'Please review and accept the Data Privacy and Consent notice.';

/** CR s3.3 step 1: contact name, email and phone number. */
export default function RegulatorOnboarding() {
    const form = useForm({ consent: false as boolean, regulator_body: 'SEC', name: '', email: '', phone: '' });
    const d = form.data;

    // Mirrors OnboardingController::storeRegulator (email uniqueness is checked by the server).
    const live = useLiveValidation(
        form.errors as Record<string, string>,
        check({
            regulator_body: [d.regulator_body, rules.required('Select the regulator.')],
            name: [d.name, rules.required('Enter the Contact Name.'), rules.max(191)],
            email: [d.email, rules.required('Enter your Email Address.'), rules.email(), rules.max(191)],
            phone: [d.phone, rules.required('Enter your Phone Number.'), rules.phone(), rules.max(30)],
            consent: [d.consent, rules.accepted(CONSENT)]
        })
    );

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!live.validateAll()) return;
        const confirmed = await confirmSubmit({
            title: 'Submit Request?',
            text: `Your ${d.regulator_body} access request for ${d.email.trim()} will be sent to FMDQ for approval.`
        });
        if (confirmed) form.post(route('onboarding.regulator.store'));
    };

    return (
        <AuthBrandLayout
            title="Regulator (SEC/CBN)"
            description="For officers who review and approve offers requiring regulatory sign-off."
        >
            <Head title="Regulator onboarding" />
            <Link
                href={route('onboarding.choose')}
                className="text-muted-foreground mb-6 inline-flex items-center gap-1 text-sm hover:underline"
            >
                <ArrowLeft className="text-gold size-4" /> Account types
            </Link>
            <form onSubmit={submit} noValidate className="space-y-4">
                <Field label="Regulator" required error={live.errors.regulator_body}>
                    <div className="grid grid-cols-2 gap-2">
                        {['SEC', 'CBN'].map((body) => (
                            <button
                                key={body}
                                type="button"
                                onClick={() => form.setData('regulator_body', body)}
                                aria-pressed={d.regulator_body === body}
                                className={cn(
                                    'rounded-lg border px-4 py-2.5 text-sm font-medium transition',
                                    d.regulator_body === body ? 'border-navy bg-navy text-white' : 'hover:border-navy/40'
                                )}
                            >
                                {body}
                            </button>
                        ))}
                    </div>
                </Field>
                <TextField label="Contact Name" required value={d.name} onChange={(v) => form.setData('name', v)} {...live.bind('name')} />
                <TextField
                    label=" Email Address"
                    type="email"
                    required
                    value={d.email}
                    onChange={(v) => form.setData('email', v)}
                    {...live.bind('email')}
                />
                <TextField
                    label="Phone Number"
                    type="tel"
                    required
                    value={d.phone}
                    onChange={(v) => form.setData('phone', v)}
                    {...live.bind('phone')}
                />
                <ConsentNotice
                    checked={d.consent}
                    onChange={(v) => {
                        form.setData('consent', v);
                        live.touch('consent');
                    }}
                    error={live.errors.consent}
                />
                <Button type="submit" className="w-full" disabled={form.processing}>
                    {form.processing && <LoaderCircle className="size-4 animate-spin" />}
                    Submit Request
                </Button>
                {live.submitted && !live.isValid && (
                    <p className="text-destructive -mt-1 text-center text-xs">Correct the highlighted fields to submit your request.</p>
                )}
            </form>
        </AuthBrandLayout>
    );
}
