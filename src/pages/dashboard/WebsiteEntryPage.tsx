import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Download, LayoutTemplate } from 'lucide-react';
import { fetchAllPages } from '../../lib/dashboardApi';
import { seedKlidoInitialContent } from '../../lib/seedKlidoCms';
import { useAuth } from '../../providers/AuthProvider';

export default function WebsiteEntryPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();

  const { data: pages = [], isLoading, isError, error } = useQuery({
    queryKey: ['pages-list'],
    queryFn: fetchAllPages,
  });

  const seedMutation = useMutation({
    mutationFn: seedKlidoInitialContent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pages-list'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Visual Website Builder
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Select any of the five approved Klido pages (Home, Services, Approach, Contact, About) to
            open the visual editor.
          </p>
        </div>

        <Link
          to="/dashboard/sections"
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-[#111111] hover:bg-zinc-50"
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          <span>Browse Block Registry</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-zinc-200/70" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Unable to load website pages.'}
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center">
          <p className="font-editorial text-lg font-semibold text-[#111111]">
            No Klido pages seeded yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
            Seed all 5 approved Klido website pages (<code>/</code>, <code>/services</code>,{' '}
            <code>/approach</code>, <code>/contact</code>, <code>/about</code>) into Supabase to
            begin visual editing.
          </p>
          {canEdit ? (
            <button
              type="button"
              disabled={seedMutation.isPending}
              onClick={() => seedMutation.mutate()}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#111111] px-4 py-2.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{seedMutation.isPending ? 'Seeding Pages…' : 'Seed 5 Klido Pages'}</span>
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-zinc-500">{page.slug}</span>
                  <span className="text-xs font-medium capitalize text-zinc-700">
                    {page.status}
                  </span>
                </div>
                <h2 className="mt-2 font-editorial text-lg font-semibold text-[#111111]">
                  {page.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                  {page.seo_metadata?.metaDescription || `Klido ${page.page_type} route`}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-4">
                <span className="text-[11px] text-zinc-400 tabular-nums">
                  Updated {new Date(page.updated_at).toLocaleDateString()}
                </span>
                <Link
                  to={`/dashboard/builder/${page.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                >
                  <span>Edit Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
