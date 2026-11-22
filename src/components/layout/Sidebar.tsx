import { NavLink } from 'react-router-dom';
import {
  Activity,
  Award,
  Blocks,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  FolderKanban,
  Globe,
  History,
  Image,
  LayoutDashboard,
  MessageSquareQuote,
  Palette,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useUiStore } from '../../stores/uiStore';

interface NavSection {
  title: string;
  items: {
    label: string;
    to: string;
    icon: typeof LayoutDashboard;
    end?: boolean;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Workspace',
    items: [
      { label: 'Overview', to: '/dashboard', icon: LayoutDashboard, end: true },
      { label: 'Website Builder', to: '/dashboard/website', icon: Globe },
      { label: 'Pages', to: '/dashboard/pages', icon: FileText },
      { label: 'Sections Library', to: '/dashboard/sections', icon: Blocks },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Services', to: '/dashboard/services', icon: Briefcase },
      { label: 'Portfolio', to: '/dashboard/projects', icon: FolderKanban },
      { label: 'Brands & Clients', to: '/dashboard/brands', icon: Award },
      { label: 'Testimonials', to: '/dashboard/testimonials', icon: MessageSquareQuote },
      { label: 'Media Library', to: '/dashboard/media', icon: Image },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Design System', to: '/dashboard/design-system', icon: Palette },
      { label: 'SEO Management', to: '/dashboard/seo', icon: Search },
      { label: 'Navigation & Footer', to: '/dashboard/navigation', icon: Compass },
      { label: 'Revision History', to: '/dashboard/revisions', icon: History },
      { label: 'Activity Log', to: '/dashboard/activity', icon: Activity },
      { label: 'Team & Roles', to: '/dashboard/users', icon: Users },
      { label: 'Settings', to: '/dashboard/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileSidebarOpen = useUiStore((s) => s.mobileSidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobileSidebarOpen = useUiStore((s) => s.setMobileSidebarOpen);

  const renderSidebarContent = (isMobile: boolean) => {
    const collapsed = !isMobile && sidebarCollapsed;

    return (
      <div className="flex h-full flex-col border-r border-zinc-200 bg-white">
        {/* Brand Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4">
          {!collapsed ? (
            <NavLink
              to="/dashboard"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex items-center gap-2.5 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#111111] text-xs font-semibold text-white">
                K
              </span>
              <span className="font-editorial text-lg font-semibold tracking-tight text-[#111111]">
                Klido Studio
              </span>
            </NavLink>
          ) : (
            <NavLink
              to="/dashboard"
              title="Klido Studio"
              className="mx-auto flex h-7 w-7 items-center justify-center rounded-md bg-[#111111] text-xs font-semibold text-white"
            >
              K
            </NavLink>
          )}

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              aria-label="Close navigation"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-[#111111]"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-[#111111]"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          aria-label="Studio navigation"
          className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5"
        >
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed ? (
                <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-zinc-400">
                  {section.title}
                </p>
              ) : null}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        title={collapsed ? item.label : undefined}
                        onClick={() => setMobileSidebarOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors whitespace-nowrap ${
                            collapsed ? 'justify-center px-0' : ''
                          } ${
                            isActive
                              ? 'bg-[#F4F3EF] font-semibold text-[#111111]'
                              : 'font-medium text-zinc-600 hover:bg-zinc-50 hover:text-[#111111]'
                          }`
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-[width] duration-150 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderSidebarContent(false)}</div>
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/25"
            aria-hidden="true"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 h-full w-64 bg-white">
            {renderSidebarContent(true)}
          </aside>
        </div>
      ) : null}
    </>
  );
}
