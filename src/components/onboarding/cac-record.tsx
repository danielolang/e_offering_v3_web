import { Section } from '@/components/section';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { router } from '@/lib/app';
import { formatDate, formatDateTime } from '@/lib/format';
import { type Tone } from '@/lib/labels';
import { History, LoaderCircle, RefreshCw } from 'lucide-react';
import { type ReactNode, useState } from 'react';

export type CacCompany = {
    approvedName?: string;
    rcNumber?: string;
    companyRegistrationDate?: string;
    classificationName?: string;
    natureOfBusiness?: string;
    status?: string;
};

export type CacLookup = {
    id: number;
    rc_number: string;
    name: string;
    result: 'verified' | 'name_mismatch' | 'rc_mismatch' | 'not_found' | 'unavailable';
    company: CacCompany | null;
    response: CacCompany[] | null;
    error: string | null;
    searched_at: string;
    searched_by_name: string | null;
};

const resultLabels: Record<string, { label: string; tone: Tone }> = {
    verified: { label: 'RC Number and Name Match', tone: 'success' },
    name_mismatch: { label: 'RC Matches, Name Differs', tone: 'warning' },
    rc_mismatch: { label: 'Name Matches, RC Differs', tone: 'warning' },
    not_found: { label: 'Not Found on CAC', tone: 'danger' },
    unavailable: { label: 'CAC Unavailable', tone: 'warning' }
};

const companyStatus: Record<string, { label: string; tone: Tone }> = {
    ACTIVE: { label: 'Active', tone: 'success' },
    INACTIVE: { label: 'Inactive', tone: 'danger' }
};

/** "BUSINESS_NAME" → "Business Name". */
const titleWords = (value?: string) =>
    (value ?? '')
        .toLowerCase()
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ');

/**
 * What the CAC register says about a QII / Non-QII: the latest search with the time it was made,
 * a button to fetch the current record again, and the earlier searches.
 */
export function CacRecord({ institutionId, lookups }: { institutionId: number; lookups: CacLookup[] }) {
    const [loading, setLoading] = useState(false);
    const [latest, ...earlier] = lookups;
    const company = latest?.company;

    const fetchLatest = () => {
        setLoading(true);
        router.post(route('admin.onboarding.cac', institutionId), {}, { onFinish: () => setLoading(false) });
    };

    const details: [string, ReactNode][] = company
        ? [
              ['Registered Name', company.approvedName],
              ['RC Number', company.rcNumber],
              ['Company Status', company.status ? <StatusBadge map={companyStatus} value={company.status} /> : null],
              ['Registration Date', company.companyRegistrationDate ? formatDate(company.companyRegistrationDate) : null],
              ['Classification', titleWords(company.classificationName)],
              ['Nature of Business', company.natureOfBusiness]
          ]
        : [];

    return (
        <Section
            title="CAC Register"
            description={
                latest
                    ? `Searched ${formatDateTime(latest.searched_at)}${latest.searched_by_name ? ` by ${latest.searched_by_name}` : ' at submission'}`
                    : 'Not yet checked against the CAC register.'
            }
            actions={
                <Button size="sm" variant="outline" onClick={fetchLatest} disabled={loading}>
                    {loading ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    Fetch Latest from CAC
                </Button>
            }
        >
            {latest ? (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <StatusBadge map={resultLabels} value={latest.result} />
                        {latest.error && <span className="text-muted-foreground">{latest.error}</span>}
                    </div>
                    {company ? (
                        <dl className="bg-muted/40 grid gap-x-6 gap-y-3 rounded-lg border p-4 text-sm sm:grid-cols-3">
                            {details.map(([label, value]) => (
                                <div key={label}>
                                    <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{label}</dt>
                                    <dd className="mt-0.5 break-words">{value || '—'}</dd>
                                </div>
                            ))}
                        </dl>
                    ) : (
                        latest.result !== 'unavailable' && (
                            <p className="text-muted-foreground text-sm">
                                CAC has no company with RC number <span className="font-mono">{latest.rc_number}</span> or the name{' '}
                                <strong>{latest.name}</strong>.
                            </p>
                        )
                    )}
                    {latest.result === 'name_mismatch' && (
                        <p className="text-sm text-amber-600">
                            The RC number matches, but the request says <strong>{latest.name}</strong> and CAC holds{' '}
                            <strong>{company?.approvedName}</strong>.
                        </p>
                    )}
                    {latest.result === 'rc_mismatch' && (
                        <p className="text-sm text-amber-600">
                            The name matches, but the request gives RC <span className="font-mono">{latest.rc_number}</span> and CAC holds
                            RC <span className="font-mono">{company?.rcNumber}</span>.
                        </p>
                    )}
                    {earlier.length > 0 && (
                        <details className="text-sm">
                            <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5">
                                <History className="size-4" /> Earlier Searches ({earlier.length})
                            </summary>
                            <ul className="mt-2 divide-y rounded-lg border">
                                {earlier.map((l) => (
                                    <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                                        <span>
                                            {formatDateTime(l.searched_at)}
                                            <span className="text-muted-foreground"> · {l.searched_by_name ?? 'At submission'}</span>
                                        </span>
                                        <span className="flex items-center gap-2">
                                            {l.company?.status && <StatusBadge map={companyStatus} value={l.company.status} />}
                                            <StatusBadge map={resultLabels} value={l.result} />
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </details>
                    )}
                </div>
            ) : (
                <p className="text-muted-foreground text-sm">Use “Fetch Latest from CAC” to check the RC number and name.</p>
            )}
        </Section>
    );
}
