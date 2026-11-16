import AppLogoIcon from './app-logo-icon';

/** FMDQ logo on its own, with the platform name underneath. */
export default function AppLogo() {
    return (
        <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#0e224e] text-xs font-bold text-white shadow-xs">
                FM
            </div>
            {/* Hidden when the sidebar collapses to icons, leaving just the logo. */}
            <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
                <div className="flex items-center gap-1 leading-none">
                    <span className="text-sm font-bold tracking-wide text-slate-900 dark:text-white">FMDQ</span>
                    <span className="size-1.5 rounded-full bg-[#c59a4c]" />
                </div>
                <span className="mt-0.5 text-[9px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                    E-OFFERING PLATFORM
                </span>
            </div>
        </div>
    );
}
