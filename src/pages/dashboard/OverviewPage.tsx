import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Database,
  ExternalLink,
  FilePlus2,
  Globe,
  HardDrive,
  Home,
  ImagePlus,
  RefreshCw,
} from 'lucide-react';
import { fetchDashboardOverview } from '../../lib/dashboardApi';
import { useAuth } from '../../providers/AuthProvider';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return 'Not yet published';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OverviewPage() {
  const { profile, canEdit } = useAuth();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: fetchDashboardOverview,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-zinc-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-white" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg border border-zinc-200 bg-white" />
          <div className="h-64 animate-pulse rounded-lg border border-zinc-200 bg-white" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <h1 className="font-editorial text-lg font-semibold text-[#111111]">
              Unable to load workspace overview
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {error instanceof Error ? error.message : 'Database request failed.'}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-[#111111] hover:bg-zinc-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (data && !data.schemaReady) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Workspace Overview
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Connected to Supabase, waiting for database schema migrations.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold text-[#111111]">
                Apply Supabase Migrations (`0001`–`0005`)
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                Run the SQL migration files in <code>supabase/migrations/</code> inside your
                Supabase SQL Editor to initialize the CMS tables, RLS policies, and Storage bucket.
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Re-check database</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const overview = data!;
  const publicationStatus =
    overview.publishedPages > 0 ? 'Published' : overview.totalPages > 0 ? 'Draft only' : 'Empty';

  const quickActions = [
    {
      label: 'Edit homepage',
      to: overview.homepageId ? `/dashboard/builder/${overview.homepageId}` : '/dashboard/pages',
      icon: Home,
    },
    { label: 'Create page', to: '/dashboard/pages', icon: FilePlus2 },
    { label: 'Open website builder', to: '/dashboard/website', icon: Globe },
    { label: 'Upload media', to: '/dashboard/media', icon: ImagePlus },
    { label: 'Manage services', to: '/dashboard/services', icon: Briefcase },
  ];

  return (
    <div className="space-y-8">
      {/* Editorial Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            Klido Studio · {profile?.role?.replace('_', ' ') ?? 'Staff'}
          </p>
          <h1 className="font-editorial mt-1 text-2xl font-semibold tracking-tight text-[#111111] sm:text-3xl">
            Website Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-[#111111] transition-colors hover:bg-zinc-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <a
            href="https://www.klido.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <span>Preview website</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Real Database Metrics Strip */}
      <section aria-label="Website metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Website Status</p>
          <p className="mt-2 text-xl font-semibold tracking-tight text-[#111111]">
            {publicationStatus}
          </p>
          <p className="mt-1 text-xs text-zinc-500 tabular-nums">
            Last published: {formatDateTime(overview.lastPublishedAt)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Total Pages</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#111111] tabular-nums">
            {overview.totalPages}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Registered CMS routes</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Published Pages</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#111111] tabular-nums">
            {overview.publishedPages}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Live on klido.in</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium text-zinc-500">Draft Pages</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#111111] tabular-nums">
            {overview.draftPages}
          </p>
          <p className="mt-1 text-xs text-zinc-500">Awaiting publication</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">Media Storage</p>
            <HardDrive className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-[#111111] tabular-nums">
            {formatBytes(overview.mediaTotalBytes)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 tabular-nums">
            {overview.mediaCount} stored asset{overview.mediaCount === 1 ? '' : 's'}
          </p>
        </div>
      </section>

      {/* Quick Actions */}
      <section aria-label="Quick actions" className="rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#111111]">Quick Actions</h2>
          {!canEdit ? (
            <span className="text-xs text-zinc-500">Read-only viewer role</span>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="flex items-center justify-between rounded-md border border-zinc-200 bg-[#FAF9F6] px-3.5 py-2.5 text-xs font-medium text-[#111111] transition-colors hover:border-zinc-300 hover:bg-zinc-100"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
                  <span>{action.label}</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent Revisions & Recent Editing Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Revisions */}
        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-[#111111]">Recent Revisions</h2>
            <Link
              to="/dashboard/revisions"
              className="text-xs font-medium text-zinc-600 hover:text-[#111111]"
            >
              View all
            </Link>
          </div>
          {overview.recentRevisions.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-[#111111]">No revisions recorded yet</p>
              <p className="mt-1 text-xs text-zinc-500">
                Create or seed your first page in Pages to start tracking drafts and published snapshots.
              </p>
              <Link
                to="/dashboard/pages"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-[#111111] hover:bg-zinc-50"
              >
                <span>Open Pages</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {overview.recentRevisions.map((rev) => (
                <li key={rev.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#111111]">
                      {rev.pages?.title ?? 'Untitled page'} · Rev #{rev.revision_number}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {rev.change_summary || 'Content update'} · {rev.status}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                    {formatDateTime(rev.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Editing Activity */}
        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-[#111111]">Recent Editing Activity</h2>
            <Link
              to="/dashboard/activity"
              className="text-xs font-medium text-zinc-600 hover:text-[#111111]"
            >
              Full log
            </Link>
          </div>
          {overview.recentActivity.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-[#111111]">No administrative activity yet</p>
              <p className="mt-1 text-xs text-zinc-500">
                Publishing, role updates, and structural edits are logged automatically here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {overview.recentActivity.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#111111]">{log.action}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {log.actor_email || 'System'} · {log.entity_type}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500 tabular-nums">
                    {formatDateTime(log.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
