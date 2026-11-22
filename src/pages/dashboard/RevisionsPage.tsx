import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, History, RotateCcw, X } from 'lucide-react';
import { fetchAllPages } from '../../lib/dashboardApi';
import {
  computeRevisionDiffSummary,
  fetchPageRevisions,
  restorePageRevision,
  type RevisionWithDetails,
} from '../../lib/revisionsApi';
import { validatePageContentTree } from '../../lib/schemaValidator';
import { PageRenderer } from '../../blocks/PageRenderer';
import { useAuth } from '../../providers/AuthProvider';

export default function RevisionsPage() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPageId, setSelectedPageId] = useState<string>('all');
  const [inspectingRev, setInspectingRev] = useState<RevisionWithDetails | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const pagesQuery = useQuery({
    queryKey: ['pages-list'],
    queryFn: fetchAllPages,
  });

  const revisionsQuery = useQuery({
    queryKey: ['page-revisions', selectedPageId],
    queryFn: () =>
      fetchPageRevisions(selectedPageId === 'all' ? undefined : selectedPageId),
  });

  const restoreMutation = useMutation({
    mutationFn: ({ pageId, revisionId }: { pageId: string; revisionId: string }) =>
      restorePageRevision(pageId, revisionId),
    onSuccess: async (restoredRev) => {
      setStatusMessage(
        `Restored snapshot into active Draft (#${restoredRev.revision_number}). Review in the Builder before publishing live.`
      );
      setInspectingRev(null);
      await queryClient.invalidateQueries({ queryKey: ['page-revisions'] });
      await queryClient.invalidateQueries({ queryKey: ['pages-list'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
    onError: (err) => {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to restore revision.');
    },
  });

  const revisions = revisionsQuery.data ?? [];

  // Compare inspecting revision against the current draft of the same page
  const comparisonDiff = useMemo(() => {
    if (!inspectingRev) return null;
    const revTree = validatePageContentTree(inspectingRev.content_json).tree;
    const currentDraft = revisions.find(
      (r) =>
        r.page_id === inspectingRev.page_id &&
        r.id === inspectingRev.pages?.draft_revision_id
    );
    const baselineTree = currentDraft
      ? validatePageContentTree(currentDraft.content_json).tree
      : null;

    return {
      revTree,
      diff: computeRevisionDiffSummary(revTree, baselineTree),
    };
  }, [inspectingRev, revisions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Revision History
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Inspect immutable published snapshots, compare section changes, and restore earlier
            versions to draft.
          </p>
        </div>

        <select
          aria-label="Filter by page"
          value={selectedPageId}
          onChange={(e) => setSelectedPageId(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-[#111111] focus:border-[#111111] focus:outline-none"
        >
          <option value="all">All Klido Pages</option>
          {(pagesQuery.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.slug})
            </option>
          ))}
        </select>
      </div>

      {statusMessage ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs text-[#111111]">
          {statusMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {revisionsQuery.isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : revisionsQuery.isError ? (
          <div className="p-6 text-sm text-red-600">
            {revisionsQuery.error instanceof Error
              ? revisionsQuery.error.message
              : 'Unable to load revision history.'}
          </div>
        ) : revisions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <History className="mx-auto h-7 w-7 text-zinc-300" />
            <p className="mt-2 text-sm font-medium text-[#111111]">No revisions recorded yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Save or publish a page in the Visual Builder to generate revision snapshots.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                  <th className="px-5 py-3">Page</th>
                  <th className="px-5 py-3">Rev #</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Summary</th>
                  <th className="px-5 py-3 text-right">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {revisions.map((rev) => {
                  const isLive = rev.pages?.published_revision_id === rev.id;
                  const isCurrentDraft = rev.pages?.draft_revision_id === rev.id;

                  return (
                    <tr key={rev.id} className="hover:bg-zinc-50/70">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[#111111]">
                          {rev.pages?.title ?? 'Page'}
                        </p>
                        <p className="font-mono text-[11px] text-zinc-500">
                          {rev.pages?.slug ?? ''}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-[#111111]">
                        #{rev.revision_number}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className="capitalize text-zinc-700">{rev.status}</span>
                        {isLive ? (
                          <span className="ml-1.5 text-[11px] font-semibold text-emerald-700">
                            · Live
                          </span>
                        ) : null}
                        {isCurrentDraft ? (
                          <span className="ml-1.5 text-[11px] font-semibold text-[#111111]">
                            · Active Draft
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-xs truncate px-5 py-3.5 text-xs text-zinc-600">
                        {rev.change_summary || 'Snapshot'}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs tabular-nums text-zinc-500">
                        {new Date(rev.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setInspectingRev(rev)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Inspect</span>
                          </button>

                          {isSuperAdmin && !isCurrentDraft ? (
                            <button
                              type="button"
                              disabled={restoreMutation.isPending}
                              onClick={() =>
                                restoreMutation.mutate({
                                  pageId: rev.page_id,
                                  revisionId: rev.id,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111] hover:underline disabled:opacity-50"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Restore</span>
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revision Visual & Structural Diff Drawer */}
      {inspectingRev && comparisonDiff ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Inspect revision snapshot"
        >
          <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h2 className="font-editorial text-lg font-semibold text-[#111111]">
                  {inspectingRev.pages?.title} — Revision #{inspectingRev.revision_number}
                </h2>
                <p className="text-xs text-zinc-500">
                  {inspectingRev.change_summary || 'Snapshot'} ·{' '}
                  {new Date(inspectingRev.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSuperAdmin &&
                inspectingRev.pages?.draft_revision_id !== inspectingRev.id ? (
                  <button
                    type="button"
                    disabled={restoreMutation.isPending}
                    onClick={() =>
                      restoreMutation.mutate({
                        pageId: inspectingRev.page_id,
                        revisionId: inspectingRev.id,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Restore to Draft</span>
                  </button>
                ) : null}
                <Link
                  to={`/dashboard/builder/${inspectingRev.page_id}`}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-zinc-50"
                >
                  Open Builder
                </Link>
                <button
                  type="button"
                  onClick={() => setInspectingRev(null)}
                  className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-12">
              <div className="border-b border-zinc-200 bg-[#FAF9F6] p-4 overflow-y-auto lg:col-span-4 lg:border-b-0 lg:border-r">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Section Diff vs Active Draft
                </p>
                <div className="mt-3 space-y-1.5">
                  {comparisonDiff.diff.items.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="flex items-center justify-between rounded border border-zinc-200 bg-white px-3 py-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#111111]">{item.name}</p>
                        <p className="font-mono text-[10px] text-zinc-400">{item.type}</p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold capitalize ${
                          item.status === 'added'
                            ? 'text-emerald-700'
                            : item.status === 'removed'
                              ? 'text-red-700'
                              : item.status === 'modified'
                                ? 'text-[#123FFF]'
                                : 'text-zinc-500'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-y-auto bg-zinc-100 p-4 lg:col-span-8">
                <div className="overflow-hidden rounded border border-zinc-200 bg-white">
                  <PageRenderer content={comparisonDiff.revTree} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
