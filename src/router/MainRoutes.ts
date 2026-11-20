import { router } from '@/lib/app';
import type { AppRoute } from './index';

/**
 * QPay returns to the URL registered for our service code (/tsp/registration?gateway=qpay)
 * with a status; the API works out which invoice it was for and marks it as paid directly.
 */
const finishGatewayPayment = (search: URLSearchParams, clearQuery: () => void) => {
    if (
        search.get('gateway') === 'qpay' ||
        search.has('status') ||
        search.has('newStatus') ||
        search.get('payment') === 'success' ||
        search.has('ref')
    ) {
        if (search.get('payment') !== 'failed') {
            router.post('/tsp/registration/fee/qpay/return', Object.fromEntries(search.entries()));
        }
        clearQuery();
    }
};

/**
 * Bid payments use their own QPay service code, whose return URL is /investor/bids/qpay-return.
 * The API matches the payment to the investor's bid, then opens it with a confirmation pop-up.
 */
const finishBidPayment = (search: URLSearchParams, clearQuery: () => void) => {
    router.post('/investor/bids/qpay/return', Object.fromEntries(search.entries()));
    clearQuery();
};

// `api: true` loads the page's data from the API path matching the screen address.
const MainRoutes: AppRoute[] = [
    { path: '/settings/profile', page: 'settings/profile', auth: true },
    { path: '/settings/password', page: 'settings/password', auth: true },
    { path: '/settings/appearance', page: 'settings/appearance', auth: true },
    { path: '/notifications', page: 'notifications/index', api: true, auth: true },

    { path: '/offers/:reference', page: 'public/offer', api: true },
    { path: '/investor/bids/qpay-return', page: 'investor/payment-return', auth: true, onArrive: finishBidPayment },
    { path: '/investor/audit-trail', page: 'audit/index', api: true, auth: true },

    { path: '/admin', page: 'admin/dashboard', api: true, auth: true },
    { path: '/admin/onboarding', page: 'admin/onboarding/index', api: true, auth: true },
    { path: '/admin/onboarding/:institution', page: 'admin/onboarding/show', api: true, auth: true },
    { path: '/admin/users', page: 'admin/users/index', api: true, auth: true },
    { path: '/admin/fees', page: 'admin/fees/index', api: true, auth: true },
    { path: '/admin/settings', page: 'admin/settings', api: true, auth: true },

    { path: '/tsp/registration', page: 'tsp/registration', api: true, auth: true, onArrive: finishGatewayPayment },
    { path: '/tsp/registration/fee/:invoice/receipt', page: 'tsp/receipt', api: true, auth: true }
];

export default MainRoutes;
