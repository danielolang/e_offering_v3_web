import { Field, FileField, TextField } from '@/components/form-field';
import { ConsentNotice } from '@/components/onboarding/consent';
import { defaultRepresentatives, type OnboardUser, UsersEditor, usersErrors } from '@/components/onboarding/users-editor';
import { Button } from '@/components/ui/button';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { confirmSubmit } from '@/lib/alert';
import { Head, Link, useForm } from '@/lib/app';
import { cn } from '@/lib/utils';
import { check, rules, useLiveValidation } from '@/lib/validation';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

const CONSENT = 'Please review and accept the Data Privacy and Consent notice.';

type FileKey = 'certificate' | 'memorandum' | 'cac_directors' | 'cac_shareholders';

/** QII / Non-QII onboarding with CAC documents and representatives (unchanged flow, CR s3.1). */
export default function InstitutionalOnboarding() {
    const form = useForm<{
        consent: boolean;
        category: 'qii' | 'non_qii' | '';
        name: string;
        registration_number: string;
        email: string;
        address: string;
        certificate: File | null;
        memorandum: File | null;
        cac_directors: File | null;
        cac_shareholders: File | null;
        users: OnboardUser[];
    }>({
        consent: false,
        category: '',
        name: '',
        registration_number: '',
        email: '',
        address: '',
        certificate: null,
        memorandum: null,
        cac_directors: null,
        cac_shareholders: null,
        users: defaultRepresentatives
    });
    const d = form.data;

    // Mirrors OnboardingController::storeInstitutional (the CAC number's uniqueness is checked by the server).
    const live = useLiveValidation(
        form.errors as Record<string, string>,
        check(
            {
                category: [d.category, rules.required('Select the investor type.')],
                name: [d.name, rules.required('Enter the registered institution name.'), rules.max(191)],
                registration_number: [d.registration_number, rules.required('Enter the CAC registration number.'), rules.max(60)],
                email: [d.email, rules.required("Enter the institution's email address."), rules.email(), rules.max(191)],
                address: [d.address, rules.max(255)],
                certificate: [d.certificate, rules.required('Upload the Certificate of Incorporation.')],
                consent: [d.consent, rules.accepted(CONSENT)]
            },
            usersErrors(d.users, false)
        )
    );

    const setFile = (key: FileKey) => (file: File | null) => {
        form.setData(key, file);
        live.touch(key);
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        if (!live.validateAll()) return;
        const confirmed = await confirmSubmit({
            title: 'Submit Onboarding Request?',
            text: `${d.name.trim()} (${d.category === 'qii' ? 'QII' : 'Non-QII'}) and its ${d.users.length} representative${d.users.length === 1 ? "" : "s"} will be sent to FMDQ for review. You cannot edit the request after submitting.`
        });
        if (confirmed) form.post(route('onboarding.institutional.store'), { forceFormData: true });
    };

    return (
        <AuthBrandLayout title="QII/Non-QII Investor" description="Onboard your institution with valid CAC documentation." wide>
            <Head title="Institutional investor onboarding" />
            <Link
                href={route('onboarding.choose')}
                className="text-muted-foreground mb-6 inline-flex items-center gap-1 text-sm hover:underline"
            >
                <ArrowLeft className="text-gold size-4" /> Account types
            </Link>
            <form onSubmit={submit} noValidate className="space-y-6">
                <Field label="Investor Type" required error={live.errors.category}>
                    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-invalid={!!live.errors.category}>
                        {[
                            ['qii', 'Qualified Institutional Investor (QII)'],
                            ['non_qii', 'Non-Qualified Institutional Investor (Non-QII)']
                        ].map(([value, label]) => (
                            <button
                                type="button"
                                role="radio"
                                aria-checked={d.category === value}
                                key={value}
                                onClick={() => {
                                    form.setData('category', value as 'qii' | 'non_qii');
                                    live.touch('category');
                                }}
                                className={cn(
                                    'rounded-lg border px-4 py-3 text-left text-sm transition',
                                    d.category === value
                                        ? 'border-navy bg-navy/5 text-navy font-medium dark:text-white'
                                        : 'hover:border-navy/40',
                                    live.errors.category && 'border-rose-400'
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                        label="Registered Institution Name"
                        required
                        value={d.name}
                        onChange={(v) => form.setData('name', v)}
                        {...live.bind('name')}
                        className="sm:col-span-2"
                    />
                    <TextField
                        label="CAC Registration Number"
                        required
                        value={d.registration_number}
                        onChange={(v) => form.setData('registration_number', v)}
                        {...live.bind('registration_number')}
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
                        label="Registered Address"
                        value={d.address}
                        onChange={(v) => form.setData('address', v)}
                        {...live.bind('address')}
                        className="sm:col-span-2"
                    />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <FileField
                        label="Certificate of Incorporation"
                        required
                        file={d.certificate}
                        onChange={setFile('certificate')}
                        error={live.errors.certificate}
                        hint="PDF, JPG or PNG, up to 5 MB."
                    />
                    <FileField
                        label="Memorandum & Articles of Association"
                        accept=".pdf"
                        maxSizeMB={10}
                        file={d.memorandum}
                        onChange={setFile('memorandum')}
                        error={live.errors.memorandum}
                    />
                    <FileField
                        label="CAC 7 (Directors)"
                        file={d.cac_directors}
                        onChange={setFile('cac_directors')}
                        error={live.errors.cac_directors}
                    />
                    <FileField
                        label="CAC 7 (Shareholders)"
                        file={d.cac_shareholders}
                        onChange={setFile('cac_shareholders')}
                        error={live.errors.cac_shareholders}
                    />
                </div>
                <fieldset className="space-y-2">
                    <legend className="text-navy text-center text-sm font-semibold uppercase dark:text-white">Representatives</legend>
                    <UsersEditor accessLevels={false} users={d.users} onChange={(u) => form.setData('users', u)} errors={live.errors} onBlur={live.touch} />
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
                    Submit Onboarding Request
                </Button>
                {live.submitted && !live.isValid && (
                    <p className="text-destructive -mt-3 text-center text-xs">Correct the highlighted fields to submit your request.</p>
                )}
            </form>
        </AuthBrandLayout>
    );
}
