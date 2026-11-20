import { FileField, TextField } from '@/components/form-field';
import { ConsentNotice } from '@/components/onboarding/consent';
import { defaultUsers, type OnboardUser, UsersEditor, usersErrors } from '@/components/onboarding/users-editor';
import { Steps } from '@/components/section';
import { Button } from '@/components/ui/button';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { confirmSubmit } from '@/lib/alert';
import { Head, Link, useForm } from '@/lib/app';
import { check, rules, useLiveValidation } from '@/lib/validation';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

const CONSENT = 'Please review and accept the Data Privacy and Consent notice.';

/** CR s3.2 steps 1-3: institution, proof of registration, users with access levels. */
export default function TspOnboarding() {
    const form = useForm<{
        consent: boolean;
        name: string;
        email: string;
        registration_number: string;
        proof: File | null;
        users: OnboardUser[];
    }>({ consent: false, name: '', email: '', registration_number: '', proof: null, users: defaultUsers });
    const d = form.data;

    // Mirrors OnboardingController::storeTsp.
    const live = useLiveValidation(
        form.errors as Record<string, string>,
        check(
            {
                name: [d.name, rules.required('Enter the institution Name.'), rules.max(191)],
                email: [d.email, rules.required("Enter the institution's Email Address."), rules.email(), rules.max(191)],
                registration_number: [d.registration_number, rules.required('Enter the FMDQ Registration Number.'), rules.max(60)],
                proof: [d.proof, rules.required('Upload the Proof of Registration.')],
                consent: [d.consent, rules.accepted(CONSENT)]
            },
            usersErrors(d.users)
        )
    );

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!live.validateAll()) return;
        const confirmed = await confirmSubmit({
            title: 'Submit Application?',
            text: `${d.name.trim()} and its ${d.users.length} authorised users will be sent to FMDQ for review. You cannot edit the application after submitting.`
        });
        if (confirmed) form.post(route('onboarding.tsp.store'), { forceFormData: true });
    };

    return (
        <AuthBrandLayout
            title="Transaction Sponsor/Registration Member"
            description="Onboard your organisation and its authorised users."
            wide
        >
            <Head title="TSP/RM onboarding" />
            <div className="mb-6 flex items-center justify-between gap-4">
                <Link
                    href={route('onboarding.choose')}
                    className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
                >
                    <ArrowLeft className="text-gold size-4" /> Account types
                </Link>
                <div className="tracking-wide uppercase"><Steps steps={['Institution', 'Users', 'FMDQ Review']} current={form.data.name && form.data.proof ? 1 : 0} /></div>
            </div>
            <form onSubmit={submit} noValidate className="space-y-6">
                <fieldset className="grid gap-4 pt-2 sm:grid-cols-2">
                    <legend className="text-navy mb-2 text-center text-sm font-semibold uppercase dark:text-white">
                        Institution Details
                    </legend>
                    <TextField
                        label="Institution Name"
                        required
                        value={d.name}
                        onChange={(v) => form.setData('name', v)}
                        {...live.bind('name')}
                    />
                    <TextField
                        label="Institution Email"
                        type="email"
                        required
                        value={d.email}
                        onChange={(v) => form.setData('email', v)}
                        {...live.bind('email')}
                    />
                    <TextField
                        label="FMDQ Registration Number"
                        required
                        value={d.registration_number}
                        onChange={(v) => form.setData('registration_number', v)}
                        {...live.bind('registration_number')}
                    />
                    <FileField
                        label="Proof of Registration"
                        required
                        file={d.proof}
                        onChange={(f) => {
                            form.setData('proof', f);
                            live.touch('proof');
                        }}
                        error={live.errors.proof}
                        hint="PDF, JPG or PNG, up to 5 MB."
                    />
                </fieldset>

                <fieldset className="space-y-2 pt-2">
                    <legend className="text-navy text-center text-sm font-semibold uppercase dark:text-white">Authorised Users</legend>
                    <UsersEditor users={d.users} onChange={(u) => form.setData('users', u)} errors={live.errors} onBlur={live.touch} />
                </fieldset>

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
                    Submit Application
                </Button>
                {live.submitted && !live.isValid && (
                    <p className="text-destructive -mt-3 text-center text-xs">Correct the highlighted fields to submit your application.</p>
                )}
            </form>
        </AuthBrandLayout>
    );
}
