import { useCallback, useState } from 'react';

/**
 * Live client-side validation for forms built on useForm.
 *
 * Rules mirror the API's Laravel rules so the user sees the same verdict before submitting.
 * A field's error appears once the user leaves it (or presses submit), then updates as they
 * type, so it clears the moment the value is fixed. Server errors (e.g. "email already has
 * an account") always win and sit in the same place.
 */

export type Rule = (value: unknown) => string | undefined;
export type Errors = Record<string, string>;

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blank = (v: unknown) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');
const text = (v: unknown) => String(v ?? '').trim();

export const rules = {
    required:
        (message = 'This field is required.'): Rule =>
        (v) =>
            blank(v) ? message : undefined,

    /** Checkboxes such as consent / terms ('accepted' in Laravel). */
    accepted:
        (message: string): Rule =>
        (v) =>
            v === true ? undefined : message,

    email:
        (message = 'Enter a valid email address, e.g. name@company.com.'): Rule =>
        (v) =>
            !blank(v) && !EMAIL.test(text(v)) ? message : undefined,

    max:
        (length: number): Rule =>
        (v) =>
            !blank(v) && text(v).length > length ? `Use ${length} characters or fewer.` : undefined,

    digits:
        (count: number, message = `Enter exactly ${count} digits.`): Rule =>
        (v) =>
            !blank(v) && !new RegExp(`^\\d{${count}}$`).test(text(v)) ? message : undefined,

    /** 7-15 digits with an optional leading +; spaces, dashes, dots and brackets are ignored. */
    phone:
        (message = 'Enter a valid phone number, e.g. 08012345678 or +2348012345678.'): Rule =>
        (v) =>
            !blank(v) && !/^\+?\d{7,15}$/.test(text(v).replace(/[\s\-().]/g, '')) ? message : undefined,

    /** Laravel 'before:today'. */
    pastDate:
        (message = 'The date must be before today.'): Rule =>
        (v) => {
            if (blank(v)) return undefined;
            const date = new Date(text(v));
            if (Number.isNaN(date.getTime())) return 'Enter a valid date.';
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today ? undefined : message;
        }
};

/**
 * Runs each field's rules in order and keeps the first failure:
 * check({ email: [data.email, rules.required(), rules.email()] }).
 */
export function check(fields: Record<string, [unknown, ...Rule[]]>, ...extra: Errors[]): Errors {
    const errors: Errors = {};
    for (const [field, [value, ...fieldRules]] of Object.entries(fields)) {
        for (const rule of fieldRules) {
            const message = rule(value);
            if (message) {
                errors[field] = message;
                break;
            }
        }
    }
    return Object.assign(errors, ...extra);
}

/** Brings the first invalid control into view (the auth card scrolls on its own). */
function revealFirstInvalid() {
    requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>('form [aria-invalid="true"]');
        if (!el) return;
        // Visually hidden inputs (the file picker) scroll their visible wrapper instead.
        const target = el.classList.contains('sr-only') && el.parentElement ? el.parentElement : el;
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (!el.classList.contains('sr-only')) el.focus({ preventScroll: true });
    });
}

/**
 * @param serverErrors the useForm errors (cleared per field as the user edits it)
 * @param clientErrors every current client-side error, keyed like the API's fields
 */
export function useLiveValidation(serverErrors: Errors, clientErrors: Errors) {
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [submitted, setSubmitted] = useState(false);

    const shown: Errors = {};
    for (const [field, message] of Object.entries(clientErrors)) {
        if (submitted || touched[field]) shown[field] = message;
    }
    // Server messages take precedence over the client's for the same field.
    const errors: Errors = { ...shown, ...serverErrors };

    const touch = useCallback((field: string) => setTouched((t) => (t[field] ? t : { ...t, [field]: true })), []);

    const isValid = Object.keys(clientErrors).length === 0;

    return {
        /** Errors to display: client errors the user has reached, plus server errors. */
        errors,
        isValid,
        submitted,
        touch,
        /** Spread onto a TextField: shows its error and marks it touched on blur. */
        bind: (field: string) => ({ error: errors[field], onBlur: () => touch(field) }),
        /** Call on submit: reveals every error and returns whether the form may be sent. */
        validateAll: () => {
            setSubmitted(true);
            if (!isValid) revealFirstInvalid();
            return isValid;
        }
    };
}
