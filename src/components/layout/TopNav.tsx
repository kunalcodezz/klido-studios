import { Link, useLocation } from 'react-router-dom';
import { ExternalLink, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useUiStore } from '../../stores/uiStore';

interface TopNavProps {
  publishedPagesCount: number | null;
  totalPagesCount: number | null;
  schemaReady?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/website': 'Website Builder',
  '/dashboard/pages': 'Pages',
  '/dashboard/sections': 'Sections Library',
  '/dashboard/services': 'Services',
  '/dashboard/projects': 'Portfolio',
  '/dashboard/brands': 'Brands & Clients',
  '/dashboard/testimonials': 'Testimonials',
  '/dashboard/media': 'Media Library',
  '/dashboard/design-system': 'Design System',
  '/dashboard/seo': 'SEO Management',
  '/dashboard/navigation': 'Navigation & Footer',
  '/dashboard/revisions': 'Revision History',
  '/dashboard/settings': 'Settings',
  '/dashboard/users': 'Team & Roles',
  '/dashboard/activity': 'Activity Log',
};

function resolveBreadcrumb(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  if (pathname.startsWith('/dashboard/builder/')) return 'Visual Page Editor';
  if (pathname.startsWith('/dashboard/pages/')) return 'Page Details';
  return 'Workspace';
}

export function TopNav({
  publishedPagesCount,
  totalPagesCount,
  schemaReady = true,
}: TopNavProps) {
  const { profile, user, isSuperAdmin, signOut } = useAuth();
  const saveStatus = useUiStore((s) => s.saveStatus);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const location = useLocation();

  const currentSection = resolveBreadcrumb(location.pathname);
  const isBuilderOrPageRoute =
    location.pathname.startsWith('/dashboard/builder/') ||
    location.pathname.startsWith('/dashboard/pages/');

  const saveLabel =
    saveStatus === 'saving'
      ? 'Saving…'
      : saveStatus === 'unsaved'
        ? 'Unsaved changes'
        : saveStatus === 'error'
          ? 'Save failed'
          : saveStatus === 'saved'
            ? 'Saved'
            : null;

  const websiteStatusText = !schemaReady
    ? 'Setup required'
    : publishedPagesCount === null
      ? 'Checking status…'
      : publishedPagesCount > 0
        ? `Live (${publishedPagesCount}/${totalPagesCount ?? publishedPagesCount} published)`
        : 'Draft only';

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 sm:px-6">
      {/* Left: Mobile drawer button + Breadcrumb */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-[#111111] hover:bg-zinc-50 lg:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <Link
            to="/dashboard"
            className="hidden whitespace-nowrap font-medium text-zinc-500 hover:text-[#111111] sm:inline"
          >
            Klido Studio
          </Link>
          <span className="hidden text-zinc-300 sm:inline" aria-hidden="true">
            /
          </span>
          <span className="truncate font-semibold text-[#111111]">{currentSection}</span>
        </nav>
      </div>

      {/* Right: Website status, Save status, Preview, User, Logout */}
      <div className="flex shrink-0 items-center gap-4">
        <div className="hidden items-center gap-3 text-xs text-zinc-500 md:flex">
          <span className="tabular-nums whitespace-nowrap">{websiteStatusText}</span>
          {saveLabel ? (
            <>
              <span aria-hidden="true">·</span>
              <span
                className={`whitespace-nowrap ${
                  saveStatus === 'error'
                    ? 'font-medium text-red-600'
                    : saveStatus === 'unsaved'
                      ? 'font-medium text-amber-700'
                      : 'text-zinc-600'
                }`}
              >
                {saveLabel}
              </span>
            </>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://www.klido.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-[#111111] transition-colors hover:bg-zinc-50"
          >
            <span>Preview Website</span>
            <ExternalLink className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
          </a>

          {isBuilderOrPageRoute && isSuperAdmin ? (
            <Link
              to="/dashboard/revisions"
              className="inline-flex items-center whitespace-nowrap rounded-md bg-[#111111] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Publish
            </Link>
          ) : null}
        </div>

        <div className="hidden h-5 w-px bg-zinc-200 sm:block" aria-hidden="true" />

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="max-w-[140px] truncate text-xs font-semibold text-[#111111]">
              {profile?.full_name || user?.email || 'Admin'}
            </p>
            <p className="text-[11px] text-zinc-500">
              {profile?.role?.replace('_', ' ') ?? 'Staff'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            title="Sign out"
            aria-label="Sign out"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-[#111111]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
