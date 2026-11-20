import { TextField } from '@/components/form-field';
import InputError from '@/components/input-error';
import { ConsentNotice } from '@/components/onboarding/consent';
import { DetailList, Steps } from '@/components/section';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AuthBrandLayout from '@/layouts/auth/auth-brand-layout';
import { confirmSubmit } from '@/lib/alert';
import { Head, Link, useForm } from '@/lib/app';
import { check, rules, useLiveValidation } from '@/lib/validation';
import { ArrowLeft, BadgeCheck, LoaderCircle } from 'lucide-react';
import { FormEvent } from 'react';

const CONSENT = 'Please review and accept the Data Privacy and Consent notice.';

interface Verified {
    first_name: string;
    last_name: string;
    bvn: string;
    phone: string | null;
    email: string | null;
    address: string | null;
}

/**
 * Retail onboarding (unchanged flow): step 1 verifies the BVN, step 2 collects contact and
 * settlement details. BVN data comes from the server, never from the browser.
 */
export default function RetailOnboarding({ verified, usesIgree }: { verified: Verified | null; usesIgree: boolean }) {
    const verify = useForm({ consent: false as boolean, bvn: '', first_name: '', last_name: '', date_of_birth: '' });
    const complete = useForm({
        email: verified?.email ?? '',
        address: verified?.address ?? '',
        csd_name: 'CSCS',
        csd_account_number: '',
        bank_name: '',
        bank_account_name: verified ? `${verified.first_name} ${verified.last_name}` : '',
        bank_account_number: '',
        terms: false as boolean
    });
    const v = verify.data;
    const c = complete.data;

    // Step 1 mirrors OnboardingController::retailVerify; with iGree only consent is collected here.
    const verifyLive = useLiveValidation(
        verify.errors as Record<string, string>,
        check({
            consent: [v.consent, rules.accepted(CONSENT)],
            ...(usesIgree
                ? {}
                : {
                      bvn: [v.bvn, rules.required('Enter your BVN.'), rules.digits(11, 'Your BVN must be exactly 11 digits.')],
                      first_name: [v.first_name, rules.required('Enter your first name as it appears on your BVN.'), rules.max(100)],
                      last_name: [v.last_name, rules.required('Enter your last name as it appears on your BVN.'), rules.max(100)],
                      date_of_birth: [v.date_of_birth, rules.pastDate('Your date of birth must be before today.')]
                  })
        } as Parameters<typeof check>[0])
    );

    // Step 2 mirrors OnboardingController::storeRetail (email uniqueness is checked by the server).
    const completeLive = useLiveValidation(
        complete.errors as Record<string, string>,
        check({
            email: [c.email, rules.required('Enter your email address.'), rules.email(), rules.max(191)],
            address: [c.address, rules.max(255)],
            csd_name: [c.csd_name, rules.max(60)],
            csd_account_number: [c.csd_account_number, rules.max(40)],
            bank_name: [c.bank_name, rules.max(100)],
            bank_account_number: [c.bank_account_number, rules.digits(10, 'The NUBAN account number must be exactly 10 digits.')],
            bank_account_name: [c.bank_account_name, rules.max(191)],
            terms: [c.terms, rules.accepted('You must accept the terms and conditions.')]
        })
    );

    return (
        <AuthBrandLayout title="Retail Investor" description="Get started with your valid Bank Verification Number (BVN)." wide>
            <Head title="Retail investor onboarding" />
            <div className="mb-6 flex items-center justify-between gap-4">
                <Link
                    href={route('onboarding.choose')}
                    className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
                >
                    <ArrowLeft className="text-gold size-4" /> Account types
                </Link>
                <div className="tracking-wide uppercase"><Steps steps={['Verify BVN', 'Your details']} current={verified ? 1 : 0} /></div>
            </div>

            {!verified ? (
                <form
                    noValidate
                    onSubmit={async (e: FormEvent) => {
                        e.preventDefault();
                        if (!verifyLive.validateAll()) return;
                        const confirmed = await confirmSubmit(
                            usesIgree
                                ? {
                                      title: 'Continue to BVN Verification?',
                                      text: 'You will be taken to the secure BVN consent page, then brought back here to finish registration.',
                                      confirmText: 'Yes, Continue'
                                  }
                                : {
                                      title: 'Validate Your BVN?',
                                      text: `We will check BVN ${v.bvn} against ${v.first_name.trim()} ${v.last_name.trim()}. Make sure the names match your BVN record.`,
                                      confirmText: 'Yes, Validate'
                                  }
                        );
                        if (confirmed) verify.post(route('onboarding.retail.verify'));
                    }}
                    className="space-y-4"
                >
                    {usesIgree ? (
                        <p className="text-muted-foreground text-sm">
                            You will be taken to the secure BVN consent page. After you approve, you return here to finish registration.
                        </p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextField
                                label="BVN"
                                required
                                inputMode="numeric"
                                maxLength={11}
                                value={v.bvn}
                                onChange={(val) => verify.setData('bvn', val.replace(/\D/g, ''))}
                                hint="11 digits"
                                {...verifyLive.bind('bvn')}
                            />
                            <TextField
                                label="Date of Birth"
                                type="date"
                                max={new Date(Date.now() - 864e5).toISOString().slice(0, 10)}
                                value={v.date_of_birth}
                                onChange={(val) => verify.setData('date_of_birth', val)}
                                {...verifyLive.bind('date_of_birth')}
                            />
                            <TextField
                                label="First Name (as on BVN)"
                                required
                                value={v.first_name}
                                onChange={(val) => verify.setData('first_name', val)}
                                {...verifyLive.bind('first_name')}
                            />
                            <TextField
                                label="Last Name (as on BVN)"
                                required
                                value={v.last_name}
                                onChange={(val) => verify.setData('last_name', val)}
                                {...verifyLive.bind('last_name')}
                            />
                        </div>
                    )}
                    {usesIgree && <InputError message={verifyLive.errors.bvn} />}
                    <ConsentNotice
                        checked={v.consent}
                        onChange={(val) => {
                            verify.setData('consent', val);
                            verifyLive.touch('consent');
                        }}
                        error={verifyLive.errors.consent}
                    />
                    <Button type="submit" className="w-full" disabled={verify.processing}>
                        {verify.processing && <LoaderCircle className="size-4 animate-spin" />}
                        {usesIgree ? 'Continue to BVN Verification' : 'Validate BVN'}
                    </Button>
                </form>
            ) : (
                <form
                    noValidate
                    onSubmit={async (e: FormEvent) => {
                        e.preventDefault();
                        if (!completeLive.validateAll()) return;
                        const confirmed = await confirmSubmit({
                            title: 'Create Your Investor Account?',
                            text: `Your account will be created with ${c.email.trim()}. Sign-in codes are sent to this email address.`,
                            confirmText: 'Yes, Create Account'
                        });
                        if (confirmed) complete.post(route('onboarding.retail.store'));
                    }}
                    className="space-y-6"
                >
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
                        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                            <BadgeCheck className="size-4" /> BVN verified
                        </p>
                        <DetailList
                            columns={3}
                            items={[
                                { label: 'First name', value: verified.first_name },
                                { label: 'Last name', value: verified.last_name },
                                { label: 'BVN', value: verified.bvn }
                            ]}
                        />
                    </div>
                    {/* The BVN verification token expired or was missing: the user has to start again. */}
                    <InputError message={(complete.errors as Record<string, string>).verification} />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TextField
                            label="Email Address"
                            type="email"
                            required
                            value={c.email}
                            onChange={(val) => complete.setData('email', val)}
                            {...completeLive.bind('email')}
                            className="sm:col-span-2"
                        />
                        <TextField
                            label="Residential Address"
                            value={c.address}
                            onChange={(val) => complete.setData('address', val)}
                            {...completeLive.bind('address')}
                            className="sm:col-span-2"
                        />
                        <TextField
                            label="CSD (e.g. CSCS, FMDQ Depository)"
                            value={c.csd_name}
                            onChange={(val) => complete.setData('csd_name', val)}
                            {...completeLive.bind('csd_name')}
                        />
                        <TextField
                            label="CSD Account Number (CHN / BPID)"
                            value={c.csd_account_number}
                            onChange={(val) => complete.setData('csd_account_number', val)}
                            {...completeLive.bind('csd_account_number')}
                        />
                        <TextField
                            label="Bank Name"
                            value={c.bank_name}
                            onChange={(val) => complete.setData('bank_name', val)}
                            {...completeLive.bind('bank_name')}
                        />
                        <TextField
                            label="Account Number (NUBAN)"
                            inputMode="numeric"
                            maxLength={10}
                            value={c.bank_account_number}
                            onChange={(val) => complete.setData('bank_account_number', val.replace(/\D/g, ''))}
                            {...completeLive.bind('bank_account_number')}
                        />
                        <TextField
                            label="Account Name"
                            value={c.bank_account_name}
                            onChange={(val) => complete.setData('bank_account_name', val)}
                            {...completeLive.bind('bank_account_name')}
                            className="sm:col-span-2"
                        />
                    </div>
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="terms"
                            checked={c.terms}
                            onCheckedChange={(val) => {
                                complete.setData('terms', val === true);
                                completeLive.touch('terms');
                            }}
                            aria-invalid={!!completeLive.errors.terms}
                            className="mt-0.5"
                        />
                        <Label htmlFor="terms" className="text-sm font-normal">
                            I accept the e-Offering Platform terms and conditions.
                        </Label>
                    </div>
                    <InputError message={completeLive.errors.terms} />
                    <Button type="submit" className="w-full" disabled={complete.processing}>
                        {complete.processing && <LoaderCircle className="size-4 animate-spin" />}
                        Create My Investor Account
                    </Button>
                    {completeLive.submitted && !completeLive.isValid && (
                        <p className="text-destructive -mt-3 text-center text-xs">Correct the highlighted fields to create your account.</p>
                    )}
                </form>
            )}
        </AuthBrandLayout>
    );
}
