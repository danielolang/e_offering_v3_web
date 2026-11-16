import AppLogoIcon from './app-logo-icon';

/** FMDQ logo on its own, with the platform name underneath. */
export default function AppLogo() {
    return (
        <div className="flex min-w-0 flex-col items-start gap-1.5">
            <div className="flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white px-1.5">
                <AppLogoIcon className="h-6 dark:bg-transparent dark:p-0" />
            </div>
            {/* Hidden when the sidebar collapses to icons, leaving just the logo. */}
            <span className="truncate text-xs leading-tight font-semibold group-data-[collapsible=icon]:hidden">
                e-Offering <span className="text-sidebar-foreground/70 font-normal">Platform</span>
            </span>
        </div>
    );
}
