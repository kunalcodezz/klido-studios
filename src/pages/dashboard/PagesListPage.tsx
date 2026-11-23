import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Download, Eye, Search, Settings } from 'lucide-react';
import { fetchAllPages } from '../../lib/dashboardApi';
import { seedKlidoInitialContent } from '../../lib/seedKlidoCms';
import { getApprovedPageOrder } from '../../data/pageRegistry';
import { useAuth } from '../../providers/AuthProvider';
import type { PageStatus } from '../../types/database';

export default function PagesListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Exclude<PageStatus, 'archived'>>('all');
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const { canEdit } = useAuth();
  const queryClient = useQueryClient();

  const { data: pages, isLoading, isError, error } = useQuery({
    queryKey: ['pages-list'],
    queryFn: fetchAllPages,
  });

  const seedMutation = useMutation({
    mutationFn: seedKlidoInitialContent,
    onSuccess: async (res) => {
      const parts = [
        `Synced 5 approved Klido pages (${res.pagesInserted} created`,
        res.pagesArchived > 0 ? `, ${res.pagesArchived} obsolete archived` : '',
        `)`,
      ];
      setSeedMessage(parts.join(''));
      await queryClient.invalidateQueries({ queryKey: ['pages-list'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
    onError: (err) => {
      setSeedMessage(err instanceof Error ? err.message : 'Unable to sync approved pages.');
    },
  });

  const filtered = useMemo(() => {
    const list = pages ?? [];
    return list.filter((page) => {
      const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        page.title.toLowerCase().includes(q) ||
        page.slug.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [pages, search, statusFilter]);

  const missingCorePagesCount = Math.max(0, 5 - (pages?.length ?? 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Pages
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage the five approved Klido website pages: Home, Services, Approach, Contact, and About.
          </p>
        </div>

        {canEdit ? (
          <button
            type="button"
            disabled={seedMutation.isPending}
            onClick={() => seedMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-[#111111] transition-colors hover:bg-zinc-50 disabled:opacity-60"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {seedMutation.isPending
                ? 'Syncing 5 Pages…'
                : missingCorePagesCount > 0
                  ? 'Seed 5 Klido Pages'
                  : 'Sync 5 Klido Pages'}
            </span>
          </button>
        ) : null}
      </div>

      {seedMessage ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-700">
          {seedMessage}
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter approved pages…"
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-[#111111] placeholder:text-zinc-400 focus:border-[#111111] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1">
          {(['all', 'published', 'draft'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-[#111111] text-white'
                  : 'text-zinc-600 hover:text-[#111111]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Unable to load pages.'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-[#111111]">No matching approved pages</p>
            <p className="mt-1 text-xs text-zinc-500">
              Click <strong>Seed 5 Klido Pages</strong> above to initialize all five approved routes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                  <th className="px-5 py-3 w-12">#</th>
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((page) => (
                  <tr key={page.id} className="hover:bg-zinc-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-400 tabular-nums">
                      0{getApprovedPageOrder(page.slug)}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#111111]">{page.title}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-600">{page.slug}</td>
                    <td className="px-5 py-3.5 text-xs capitalize text-zinc-700">
                      {page.status}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs tabular-nums text-zinc-500">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          to={`/preview/${page.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-[#111111]"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Preview</span>
                        </Link>
                        <Link
                          to={`/dashboard/pages/${page.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-[#111111]"
                        >
                          <Settings className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>SEO</span>
                        </Link>
                        <Link
                          to={`/dashboard/builder/${page.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111] hover:underline"
                        >
                          <span>Open Builder</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
