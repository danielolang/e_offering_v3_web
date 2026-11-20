import { amountInWords, formatDate, formatMoney, toNumber } from '@/lib/format';
import { type Offer } from '@/types';
import { type ReactNode } from 'react';

/** The legacy Standardised Commitment Form's fields, as stored on a bid ("commitment"). */
export interface CommitmentValues {
    date?: string | null;
    control_no?: string | null;
    investor_type?: string | null;
    orders: { amount: string | number; rate?: string | number | null }[];
    surname?: string | null;
    first_name?: string | null;
    other_names?: string | null;
    joint_first_name?: string | null;
    joint_other_names?: string | null;
    contact_person?: string | null;
    address_line_1?: string | null;
    address_line_2?: string | null;
    address_line_3?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    email?: string | null;
    allotment_preference?: 'certificate' | 'book_entry' | string | null;
    cscs_account_no?: string | null;
    clearing_house_no?: string | null;
    stockbroking_firm_cscs?: string | null;
    fmdq_bpid_no?: string | null;
    client_bpid_no?: string | null;
    stockbroking_firm_fmdq?: string | null;
    bank_name?: string | null;
    branch?: string | null;
    bank_account_number?: string | null;
    bank_city_state?: string | null;
    bank_account_name?: string | null;
    security_dealer?: string | null;
    /** The sponsor / co-sponsor / receiving agent the bid goes through. */
    sponsor?: string | null;
    /** Co-sponsors listed on the offer. */
    co_sponsors?: string[];
}

export type CommitmentImages = Partial<Record<'signature_1' | 'signature_2' | 'official_seal', string | null>>;

/** Legacy tick-box grid (labels as printed) and the v3 investor type each box stands for. */
const PARTICIPANT_GRID: [string, string][][] = [
    [
        ['pfa', 'PFA'],
        ['unit_trust', 'Investments/Unit Trusts'],
        ['trustee', 'Trustee/Custodian']
    ],
    [
        ['fund_manager', 'Fund Manager'],
        ['hni', 'HNI'],
        ['stockbroker', 'Stock Broker']
    ],
    [
        ['bank', 'Bank'],
        ['private_equity', 'Private Equity']
    ],
    [
        ['insurance', 'Insurance Company'],
        ['staff_scheme', 'Staff Scheme']
    ]
];
const ON_GRID = PARTICIPANT_GRID.flat().map(([key]) => key);
const OFF_GRID_LABELS: Record<string, string> = { individual: 'Individual', registrar: 'Registrar', others: 'Others' };

const Box = ({ checked }: { checked: boolean }) => <span className={`lcf-box${checked ? ' lcf-box-on' : ''}`}>{checked ? '✓' : ''}</span>;
const Val = ({ children }: { children?: ReactNode }) => (
    <span className="lcf-val">{children === null || children === undefined || children === '' ? ' ' : children}</span>
);
const plain = (amount: number) => (amount > 0 ? new Intl.NumberFormat('en-US').format(amount) : '');

/**
 * Read-only replica of the legacy e-Offering "Standardised Commitment Form" (front page and
 * reverse side), with the same ruled tables, red header bars and wording, filled in with the
 * bid's details. It always renders as a white paper form, whatever the app theme.
 */
export function CommitmentSheet({ offer, values, images = {} }: { offer: Offer; values: CommitmentValues; images?: CommitmentImages }) {
    const rateLabel = `BID ${String(offer.rate_label || 'Coupon rate').toUpperCase()}`;
    const minimum = formatMoney(offer.min_subscription_amount, 0);
    const step = toNumber(offer.subsequent_increment);
    const amountRule =
        step > 0
            ? `PARTICIPATION AMOUNT (MINIMUM OF ${minimum} AND IN MULTIPLES OF ${formatMoney(step, 0)} THEREAFTER)`
            : `PARTICIPATION AMOUNT (MINIMUM OF ${minimum})`;
    const offGridType = values.investor_type && !ON_GRID.includes(values.investor_type) ? values.investor_type : null;
    const orders = [0, 1, 2].map((i) => values.orders[i] ?? null);
    const fixedRate = offer.price_discovery_method === 'fixed_rate' ? offer.rate : null;

    return (
        <div className="lcf">
            <section className="lcf-one">
                <div className="lcf-group">
                    <table>
                        <tbody>
                            <tr className="lcf-head">
                                <th colSpan={18} className="lcf-s1">
                                    PLEASE COMPLETE ALL RELEVANT SECTIONS OF THIS FORM USING BLOCK LETTERS WHERE APPLICABLE
                                </th>
                            </tr>
                            <tr>
                                <td colSpan={10} className="lcf-s1">
                                    DATE(DD/MM/YYYY)
                                </td>
                                <td colSpan={8} className="lcf-s1">
                                    CONTROL NO (FOR REGISTRARS&apos; USE ONLY)
                                </td>
                            </tr>
                            <tr className="lcf-row">
                                <td colSpan={10}>
                                    <Val>{values.date ? formatDate(values.date) : ''}</Val>
                                </td>
                                <td colSpan={8}>
                                    <Val>{values.control_no}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={18} className="lcf-s1-big">
                                    PARTICIPANTS CAN INDICATE UPTO THREE (3) OPTIONAL BID MARGINS AND SPECIFY THE PARTICIPATION AMOUNT
                                    APPLICABLE TO EACH BID INTEREST RATE. THESE WILL BE TREATED AS OPTIONAL ORDERS AND WILL NOT BE
                                    AGGREGATED. PLEASE TICK THE APPLICABLE BOX ON THE RIGHT
                                </td>
                            </tr>
                            {PARTICIPANT_GRID.map((row, r) => (
                                <tr key={r} className="lcf-row">
                                    {[0, 1, 2].map((c) => {
                                        const cell = row[c];
                                        // Investor types the paper form had no box for use the row's spare cells.
                                        const spare =
                                            !cell && offGridType && r === 2
                                                ? [offGridType, OFF_GRID_LABELS[offGridType] ?? offGridType]
                                                : null;
                                        const [key, label] = cell ?? spare ?? ['', ''];
                                        return [
                                            <td key={`b${c}`} className="lcf-check">
                                                {key ? <Box checked={values.investor_type === key} /> : null}
                                            </td>,
                                            <td key={`l${c}`} colSpan={5}>
                                                {label}
                                            </td>
                                        ];
                                    })}
                                </tr>
                            ))}
                            <tr className="lcf-head lcf-row">
                                <td colSpan={18} className="lcf-s1">
                                    PARTICIPANTS DETAILS(The participation Amount(s) and the Bid Coupon rate(s) must be stated in the boxes
                                    below)
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {orders.map((order, i) => {
                        const amount = order ? toNumber(order.amount) : 0;
                        const rate = order?.rate ?? (order ? fixedRate : null);
                        return (
                            <div key={i}>
                                <div className="lcf-order">Order {i + 1}</div>
                                <table>
                                    <tbody>
                                        <tr className="lcf-head">
                                            <th colSpan={20} style={{ width: '95%' }}>
                                                {amountRule}
                                            </th>
                                            <th colSpan={4} className="lcf-rate-head" style={{ width: '5%' }}>
                                                {rateLabel}
                                            </th>
                                        </tr>
                                        <tr>
                                            <td colSpan={4} style={{ width: '3%' }}>
                                                IN FIGURES
                                            </td>
                                            <td className="lcf-row lcf-naira" style={{ width: '2%' }}>
                                                ₦
                                            </td>
                                            <td className="lcf-row" colSpan={15} style={{ width: '20%' }}>
                                                <Val>{plain(amount)}</Val>
                                            </td>
                                            <td colSpan={4} rowSpan={2}>
                                                <Val>{rate !== null && rate !== undefined && rate !== '' ? `${Number(rate)}` : ''}</Val>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan={4} className="lcf-row">
                                                IN WORDS
                                            </td>
                                            <td colSpan={16} className="lcf-row">
                                                <Val>{amount > 0 ? <span className="lcf-words">{amountInWords(amount)}</span> : ''}</Val>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="lcf-two">
                <div className="lcf-group">
                    <table className="lcf-gap">
                        <tbody>
                            <tr className="lcf-head">
                                <th className="lcf-s2">COMMITMENT FORM (REVERSE SIDE)</th>
                            </tr>
                        </tbody>
                    </table>
                    <table className="lcf-gap">
                        <tbody>
                            <tr className="lcf-head">
                                <th className="lcf-s2">
                                    PARTICIPANTS DETAILS (INDIVIDUAL/CORPORATE/JOINT)(PLEASE USE ONE BOX FOR ONE ALPHABET LEAVING ONE BOX
                                    BLANK BETWEEN FIRST WORD AND SECOND)
                                </th>
                            </tr>
                        </tbody>
                    </table>
                    <div className="lcf-caption">SURNAME/CORPORATE NAME</div>
                    <table>
                        <tbody>
                            <tr>
                                <td className="lcf-row" colSpan={24}>
                                    <Val>{values.surname?.toUpperCase()}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={12} style={{ borderRight: 'none' }}>
                                    FIRST NAME (INDIVIDUALS ONLY)
                                </td>
                                <td colSpan={12} style={{ borderLeft: 'none' }}>
                                    OTHER NAMES (INDIVIDUALS ONLY)
                                </td>
                            </tr>
                            <tr>
                                <td className="lcf-row" colSpan={12}>
                                    <Val>{values.first_name?.toUpperCase()}</Val>
                                </td>
                                <td className="lcf-row" colSpan={12}>
                                    <Val>{values.other_names?.toUpperCase()}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={12} style={{ borderRight: 'none' }}>
                                    JOINT APPLICANT&apos;S FIRST NAME (IF APPLICABLE)
                                </td>
                                <td colSpan={12} style={{ borderLeft: 'none' }}>
                                    OTHER NAMES (FOR JOINT APPLICANTS ONLY)
                                </td>
                            </tr>
                            <tr>
                                <td className="lcf-row" colSpan={12}>
                                    <Val>{values.joint_first_name?.toUpperCase()}</Val>
                                </td>
                                <td className="lcf-row" colSpan={12}>
                                    <Val>{values.joint_other_names?.toUpperCase()}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={24} className="lcf-pad">
                                    CONTACT PERSON (FOR CORPORATE APPLICANT)/ NEXT OF KIN(FOR INDIVIDUAL APPLICANT)
                                </td>
                            </tr>
                            <tr>
                                <td className="lcf-row" colSpan={24}>
                                    <Val>{values.contact_person?.toUpperCase()}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={24} className="lcf-pad">
                                    ADDRESS IN FULL (PLEASE DO NOT REPEAT APPLICANT(S)&apos; NAME) POST BOX NO. ALONE IS NOT SUFFICIENT
                                </td>
                            </tr>
                            <tr>
                                <td className="lcf-row" colSpan={24}>
                                    <Val>{values.address_line_1?.toUpperCase()}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td className="lcf-row" colSpan={24}>
                                    <Val>{values.address_line_2?.toUpperCase()}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td className="lcf-row" colSpan={13}>
                                    <Val>{values.address_line_3?.toUpperCase()}</Val>
                                </td>
                                <td className="lcf-row" colSpan={2}>
                                    TEL
                                </td>
                                <td className="lcf-row" colSpan={9}>
                                    <Val>{values.phone}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td className="lcf-row" colSpan={2}>
                                    CITY
                                </td>
                                <td className="lcf-row" colSpan={7}>
                                    <Val>{values.city?.toUpperCase()}</Val>
                                </td>
                                <td className="lcf-row">STATE</td>
                                <td className="lcf-row" colSpan={3}>
                                    <Val>{values.state?.toUpperCase()}</Val>
                                </td>
                                <td className="lcf-row" colSpan={2}>
                                    EMAIL
                                </td>
                                <td className="lcf-row" colSpan={9}>
                                    <Val>{values.email}</Val>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="lcf-three">
                <div className="lcf-group">
                    <table className="lcf-gap">
                        <tbody>
                            <tr className="lcf-head">
                                <th className="lcf-s2">ALLOTMENT PREFERENCE:</th>
                            </tr>
                        </tbody>
                    </table>
                    <div className="lcf-tick">
                        <div style={{ marginRight: 5, paddingLeft: 20 }}>Please tick in the box to indicate allotment preference -</div>
                        <div className="lcf-tick-item">
                            <span>CERTIFICATE</span> <Box checked={values.allotment_preference === 'certificate'} />
                        </div>
                        <div className="lcf-tick-item">
                            <span>ELECTRONIC (BOOK ENTRY)</span> <Box checked={values.allotment_preference === 'book_entry'} />
                        </div>
                    </div>

                    <table className="lcf-gap">
                        <tbody>
                            <tr className="lcf-head">
                                <th className="lcf-s2" colSpan={24}>
                                    E-ALLOTMENT DETAILS (FOR E-BOOK ENTRY ALLOTMENT ONLY) (AS APPLICABLE)
                                </th>
                            </tr>
                            <tr>
                                <td colSpan={24} style={{ border: 'none' }}>
                                    Please credit my/our CSCS account as detailed below to the extent of the bonds alloted :
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ width: '20%' }}>
                                    PARTICIPANTS CSCS ACCOUNT NO:
                                </td>
                                <td colSpan={10} style={{ width: '30%' }}>
                                    <Val>{values.cscs_account_no}</Val>
                                </td>
                                <td colSpan={2} style={{ width: '20%' }}>
                                    CHN (CLEARING HOUSE NUMBER)
                                </td>
                                <td colSpan={10} style={{ width: '30%' }}>
                                    <Val>{values.clearing_house_no}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={5} style={{ border: 'none' }}>
                                    NAME OF STOCKBROKING FIRM
                                </td>
                                <td colSpan={19} style={{ border: 'none' }}>
                                    <span className="lcf-boxed">{values.stockbroking_firm_cscs || ' '}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="lcf-gap">
                        <tbody>
                            <tr className="lcf-head">
                                <th className="lcf-s2" colSpan={24}>
                                    E-ALLOTMENT DETAILS (FOR E-BOOK ENTRY ALLOTMENT ONLY) (AS APPLICABLE)
                                </th>
                            </tr>
                            <tr>
                                <td colSpan={24} style={{ border: 'none' }}>
                                    Please credit my/our Investor&apos;s account as detailed below to the extent of the bonds alloted on
                                    FMDQ Depository (Q-ex) :
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ width: '20%', fontSize: 10 }}>
                                    FMDQ DEPOSITORY PARTICIPANT&apos;S BPID NO:
                                </td>
                                <td colSpan={10} style={{ width: '30%' }}>
                                    <Val>{values.fmdq_bpid_no}</Val>
                                </td>
                                <td colSpan={2} style={{ width: '20%' }}>
                                    CLIENT BPID NO:
                                </td>
                                <td colSpan={10} style={{ width: '30%' }}>
                                    <Val>{values.client_bpid_no}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={5} style={{ border: 'none' }}>
                                    NAME OF STOCKBROKING FIRM
                                </td>
                                <td colSpan={19} style={{ border: 'none' }}>
                                    <span className="lcf-boxed">{values.stockbroking_firm_fmdq || ' '}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="lcf-gap">
                        <tbody>
                            <tr className="lcf-head">
                                <th className="lcf-s2" colSpan={24}>
                                    BANK DETAILS FOR E-PAYMENTS
                                </th>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ width: '15%' }}>
                                    BANK NAME
                                </td>
                                <td colSpan={16} style={{ width: '50%' }}>
                                    <Val>{values.bank_name?.toUpperCase()}</Val>
                                </td>
                                <td colSpan={2} style={{ width: '10%' }}>
                                    BRANCH
                                </td>
                                <td colSpan={4} style={{ width: '30%' }}>
                                    <Val>{values.branch?.toUpperCase()}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ width: '15%' }}>
                                    ACCOUNT NO
                                </td>
                                <td colSpan={16} style={{ width: '50%' }}>
                                    <Val>{values.bank_account_number}</Val>
                                </td>
                                <td colSpan={2} style={{ width: '10%' }}>
                                    CITY/STATE
                                </td>
                                <td colSpan={4} style={{ width: '30%' }}>
                                    <Val>{values.bank_city_state?.toUpperCase()}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ width: '15%' }}>
                                    ACCOUNT NAME
                                </td>
                                <td colSpan={16} style={{ width: '50%' }}>
                                    <Val>{values.bank_account_name?.toUpperCase()}</Val>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ width: '15%' }}>
                                    SECURITY DEALER
                                </td>
                                <td colSpan={16} style={{ width: '50%' }}>
                                    <Val>{values.security_dealer?.toUpperCase()}</Val>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="lcf-gap">
                        <tbody>
                            <tr className="lcf-head">
                                <th className="lcf-s2" colSpan={24}>
                                    CO-SPONSORS
                                </th>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ width: '15%' }}>
                                    SPONSOR LIST
                                </td>
                                <td colSpan={16} style={{ width: '50%' }}>
                                    {values.co_sponsors && values.co_sponsors.length > 0 ? (
                                        <ul className="lcf-list">
                                            {values.co_sponsors.map((name) => (
                                                <li key={name}>{name}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <Val />
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ width: '15%' }}>
                                    SELECT SPONSOR/CO-SPONSOR
                                </td>
                                <td colSpan={16} style={{ width: '50%' }}>
                                    <Val>{values.sponsor}</Val>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <table className="lcf-gap">
                        <tbody>
                            <tr className="lcf-head">
                                <th className="lcf-s2" colSpan={24}>
                                    Signatures
                                </th>
                            </tr>
                            <tr>
                                <td>FIRST SIGNATURE</td>
                                <td>2ND SIGNATURE (CORPORATE/JOINT)</td>
                                <td>OFFICIAL SEAL/RC. NO.</td>
                            </tr>
                            <tr>
                                {(['signature_1', 'signature_2', 'official_seal'] as const).map((key) => (
                                    <td key={key} className="lcf-sign">
                                        {images[key] ? (
                                            <img src={images[key]!} alt={key.replace('_', ' ')} />
                                        ) : (
                                            <span className="lcf-unsigned">Not provided</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
