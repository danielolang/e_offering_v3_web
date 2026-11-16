import { Breadcrumbs } from '@/components/breadcrumbs';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType, type SharedData } from '@/types';
import { Link, usePage } from '@/lib/app';
import { Bell } from 'lucide-react';

/** Page header: menu toggle + breadcrumb on the left; notifications, role and theme on the right. */
export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { auth, notifications } = usePage<SharedData>().props;
    const unread = notifications?.unread ?? 0;

    return (
        <header className="border-sidebar-border/50 bg-background/80 sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
                <SidebarTrigger className="-ml-1" aria-label="Toggle menu" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="ml-auto flex items-center gap-2.5">
                {auth?.user && (
                    <span className="hidden items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1 text-xs font-medium text-slate-700 shadow-xs sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                        <span className="font-semibold text-slate-800 dark:text-white">{auth.user.role_label}</span>
                        {auth.user.institution && auth.user.type !== 'regulator' && (
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                                {auth.user.institution.name}
                            </span>
                        )}
                    </span>
                )}
                <Button variant="ghost" size="icon" asChild className="relative" aria-label={`Notifications (${unread} unread)`}>
                    <Link href={route('notifications.index')}>
                        <Bell className="size-5 text-slate-600 dark:text-slate-300" />
                        {unread > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-xs">
                                {unread > 99 ? '99+' : unread}
                            </span>
                        )}
                    </Link>
                </Button>
                <ThemeToggle />
            </div>
        </header>
    );
}
