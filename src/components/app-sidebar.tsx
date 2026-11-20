import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { routePath } from '@/lib/url';
import { type AuthUser, type NavGroup, type SharedData } from '@/types';
import { Link, usePage } from '@/lib/app';
import {
    Archive,
    BadgeCheck,
    BarChart3,
    Bell,
    BookOpenCheck,
    Building2,
    ClipboardList,
    FilePlus2,
    FileWarning,
    Gauge,
    History,
    Landmark,
    ListChecks,
    PieChart,
    ReceiptText,
    ScrollText,
    Settings2,
    ShieldCheck,
    Users,
    Wallet,
} from 'lucide-react';
import AppLogo from './app-logo';

/** Role-based navigation (replaces the three hard-coded legacy layouts). */
export function navigationFor(user: AuthUser | null | undefined): NavGroup[] {
    if (!user) return [];
    switch (user.type) {
        case 'admin':
            return [
                {
                    title: 'Overview',
                    items: [{ title: 'Dashboard', url: routePath('admin.dashboard'), icon: PieChart }],
                },
                {
                    title: 'Administration',
                    items: [
                        { title: 'Onboarding Requests', url: routePath('admin.onboarding.index'), icon: BadgeCheck },
                        { title: 'Users', url: routePath('admin.users.index'), icon: Users },
                        { title: 'Platform Fees', url: routePath('admin.fees.index'), icon: Wallet },
                        { title: 'Settings', url: routePath('admin.settings'), icon: Settings2 },
                    ],
                },
                {
                    title: 'Market',
                    items: [
                        { title: 'Offers', url: routePath('admin.offers.index'), icon: Landmark },
                        { title: 'Lodgement', url: routePath('csd.lodgements.index'), icon: Archive },
                        { title: 'Audit Trail', url: routePath('admin.audit'), icon: ScrollText },
                    ],
                },
            ];
        case 'tsp': {
            if (!user.tsp_full_access) {
                return [{ title: 'Getting started', items: [{ title: 'Registration', url: routePath('tsp.registration.show'), icon: ClipboardList }] }];
            }
            const offerItems = [{ title: 'All Offers', url: routePath('tsp.offers.index'), icon: Landmark }];
            if (user.access_level === 'inputter') {
                offerItems.push({ title: 'Create Offer', url: routePath('tsp.offers.create'), icon: FilePlus2 });
            }
            return [
                { title: 'Overview', items: [{ title: 'Dashboard', url: routePath('tsp.dashboard'), icon: PieChart }] },
                { title: 'Offers', items: offerItems },
                {
                    title: 'Book Building',
                    items: [
                        { title: 'View Order Book', url: routePath('tsp.order-book.index'), icon: BookOpenCheck },
                        { title: 'Allotment', url: routePath('tsp.allotments.index'), icon: ListChecks },
                    ],
                },
                {
                    title: 'Reporting',
                    items: [
                        { title: 'Offer Summary Report', url: routePath('tsp.reports.index'), icon: BarChart3 },
                        { title: 'Exception Report', url: routePath('tsp.reports.exceptions'), icon: FileWarning },
                        { title: 'Audit Trail', url: routePath('tsp.audit'), icon: ScrollText },
                    ],
                },
                { title: 'Account', items: [{ title: 'Registration & Fees', url: routePath('tsp.registration.show'), icon: ReceiptText }] },
            ];
        }
        case 'investor':
            return [
                {
                    title: 'Investor',
                    items: [
                        { title: 'Dashboard', url: routePath('investor.dashboard'), icon: Gauge },
                        { title: 'Offers', url: routePath('investor.offers.index'), icon: Landmark },
                        { title: 'My Bids & Payments', url: routePath('investor.history'), icon: History },
                        { title: 'Audit Trail', url: routePath('investor.audit'), icon: ScrollText },
                        { title: 'Notifications', url: routePath('notifications.index'), icon: Bell },
                    ],
                },
            ];
        case 'regulator':
            return [{ title: 'Regulator', items: [{ title: 'Allotment Reviews', url: routePath('regulator.dashboard'), icon: ShieldCheck }] }];
        case 'csd':
            return [{ title: 'Depository', items: [{ title: 'Lodgements', url: routePath('csd.lodgements.index'), icon: Building2 }] }];
        default:
            return [];
    }
}

/** Nav item on the navy rail: soft highlight on hover, gold marker and icon when active. */
const navItem =
    "relative h-9 text-sidebar-foreground/85 transition-colors before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-gold before:opacity-0 before:transition-opacity hover:bg-white/8 hover:text-white data-[active=true]:bg-white/12 data-[active=true]:font-semibold data-[active=true]:text-white data-[active=true]:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] data-[active=true]:before:opacity-100 [&>svg]:transition-colors data-[active=true]:[&>svg]:text-gold-light";

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const page = usePage();
    const path = page.url.split('?')[0];
    const groups = navigationFor(auth.user);
    const allUrls = groups.flatMap((g) => g.items.map((i) => i.url));

    // The most specific matching item wins, so "/tsp/offers/create" does not also light up "/tsp/offers".
    const activeUrl = allUrls
        .filter((url) => path === url || path.startsWith(url + '/'))
        .sort((a, b) => b.length - a.length)[0];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="h-auto py-2 hover:bg-white/5 active:bg-white/5">
                            <Link href={route('dashboard')} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {groups.map((group) => (
                    <SidebarGroup key={group.title} className="px-2 py-0">
                        <SidebarGroupLabel className="mt-3 text-[10px] font-bold tracking-[0.16em] text-white/45 uppercase">{group.title}</SidebarGroupLabel>
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <SidebarMenuButton key={item.url + item.title} asChild isActive={item.url === activeUrl} tooltip={item.title} className={navItem}>
                                    <Link href={item.url} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
