import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Download, Plus, Search, Settings, X } from 'lucide-react';
import { fetchAllPages } from '../../lib/dashboardApi';
import { createNewCmsPage } from '../../lib/revisionsApi';
import { seedKlidoInitialContent } from '../../lib/seedKlidoCms';
import { useAuth } from '../../providers/AuthProvider';
import type { PageStatus, PageType } from '../../types/database';

export default function PagesListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PageStatus>('all');
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('/');
  const [newType, setNewType] = useState<PageType>('landing');
  const [createError, setCreateError] = useState<string | null>(null);

  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: pages, isLoading, isError, error } = useQuery({
    queryKey: ['pages-list'],
    queryFn: fetchAllPages,
  });

  const seedMutation = useMutation({
    mutationFn: seedKlidoInitialContent,
    onSuccess: async (res) => {
      setSeedMessage(
        `Seeded ${res.pagesInserted} page(s), ${res.servicesInserted} service(s), ${res.brandsInserted} brand(s), and ${res.navInserted} nav item(s).`
      );
      await queryClient.invalidateQueries({ queryKey: ['pages-list'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
    onError: (err) => {
      setSeedMessage(err instanceof Error ? err.message : 'Unable to seed pages.');
    },
  });

  const createPageMutation = useMutation({
    mutationFn: () =>
      createNewCmsPage({
        title: newTitle,
        slug: newSlug,
        page_type: newType,
      }),
    onSuccess: async (created) => {
      setCreateError(null);
      setCreateOpen(false);
      setNewTitle('');
      setNewSlug('/');
      await queryClient.invalidateQueries({ queryKey: ['pages-list'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      navigate(`/dashboard/builder/${created.id}`);
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : 'Unable to create page.');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Pages
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage Klido website routes, SEO metadata, publication status, and visual page trees.
          </p>
        </div>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={seedMutation.isPending}
              onClick={() => seedMutation.mutate()}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-[#111111] transition-colors hover:bg-zinc-50 disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {seedMutation.isPending ? 'Seeding Klido pages…' : 'Seed 5 Klido Pages'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setCreateOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Page</span>
            </button>
          </div>
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
            placeholder="Filter by title or slug…"
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-[#111111] placeholder:text-zinc-400 focus:border-[#111111] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1">
          {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
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
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-6 text-sm text-red-600">
            {error instanceof Error ? error.message : 'Unable to load pages.'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-[#111111]">No matching pages found</p>
            <p className="mt-1 text-xs text-zinc-500">
              Click <strong>Seed 5 Klido Pages</strong> or <strong>New Page</strong> above to get
              started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((page) => (
                  <tr key={page.id} className="hover:bg-zinc-50/70">
                    <td className="px-5 py-3.5 font-medium text-[#111111]">{page.title}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-600">{page.slug}</td>
                    <td className="px-5 py-3.5 text-xs capitalize text-zinc-600">
                      {page.page_type}
                    </td>
                    <td className="px-5 py-3.5 text-xs capitalize text-zinc-700">
                      {page.status}
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs tabular-nums text-zinc-500">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-3">
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

      {/* Create Page Modal */}
      {createOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Create new page"
        >
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="font-editorial text-lg font-semibold text-[#111111]">
                Create New Page
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {createError ? (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {createError}
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-[#111111]">Page Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewTitle(val);
                    const autoSlug = `/${val
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '')}`;
                    setNewSlug(autoSlug || '/');
                  }}
                  placeholder="e.g. Performance Creative Sprint"
                  className="mt-1.5 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">Route Slug</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  placeholder="/creative-sprint"
                  className="mt-1.5 w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">Page Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as PageType)}
                  className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="landing">Landing Page</option>
                  <option value="standard">Standard Page</option>
                  <option value="services">Services</option>
                  <option value="approach">Approach</option>
                  <option value="about">About</option>
                  <option value="contact">Contact</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-[#FAF9F6] px-5 py-3.5">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-[#111111]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createPageMutation.isPending || !newTitle.trim()}
                onClick={() => createPageMutation.mutate()}
                className="rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {createPageMutation.isPending ? 'Creating…' : 'Create & Open Builder'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
