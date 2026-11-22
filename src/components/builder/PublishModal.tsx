import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Globe, Lock, X } from 'lucide-react';
import {
  computeRevisionDiffSummary,
  fetchPublishedBaselineTree,
  publishPageRevision,
} from '../../lib/revisionsApi';
import { saveBuilderDraft } from '../../lib/builderApi';
import { useEditorStore } from '../../stores/editorStore';
import { useAuth } from '../../providers/AuthProvider';

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  onPublishedSuccess: (revisionNumber: number) => void;
}

export function PublishModal({
  open,
  onClose,
  onPublishedSuccess,
}: PublishModalProps) {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const {
    pageId,
    pageMeta,
    draftRevisionId,
    content,
    isDirty,
    markSaved,
    updatePageMeta,
  } = useEditorStore();

  const [changeSummary, setChangeSummary] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const baselineQuery = useQuery({
    queryKey: ['published-baseline', pageMeta?.published_revision_id],
    queryFn: () => fetchPublishedBaselineTree(pageMeta?.published_revision_id ?? null),
    enabled: open && Boolean(pageMeta),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!pageId || !pageMeta) throw new Error('Missing page metadata.');
      let activeDraftRevId = draftRevisionId;

      if (isDirty || !activeDraftRevId) {
        const saved = await saveBuilderDraft(
          pageId,
          draftRevisionId,
          content,
          changeSummary.trim() || 'Pre-publish draft snapshot'
        );
        activeDraftRevId = saved.revisionId;
        markSaved(saved.revisionId);
      }

      const published = await publishPageRevision(
        pageId,
        activeDraftRevId,
        changeSummary.trim() || 'Published from Klido Visual Builder'
      );

      return published;
    },
    onSuccess: async (publishedRev) => {
      setErrorMsg(null);
      if (pageMeta) {
        updatePageMeta({
          ...pageMeta,
          status: 'published',
          published_revision_id: publishedRev.id,
          published_at: publishedRev.published_at,
        });
      }
      await queryClient.invalidateQueries({ queryKey: ['pages-list'] });
      await queryClient.invalidateQueries({ queryKey: ['page-revisions'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      onPublishedSuccess(publishedRev.revision_number);
      setChangeSummary('');
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to publish revision.');
    },
  });

  if (!open || !pageMeta) return null;

  const diff = computeRevisionDiffSummary(content, baselineQuery.data ?? null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Publish page revision"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#111111]" />
            <h2 className="font-editorial text-lg font-semibold text-[#111111]">
              Publish &ldquo;{pageMeta.title}&rdquo;
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close publish dialog"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {!isSuperAdmin ? (
            <div className="flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Only <strong>SUPER_ADMIN</strong> users can publish changes live to{' '}
                <code>{pageMeta.slug}</code>. Your draft is safely stored for Super Admin review.
              </span>
            </div>
          ) : null}

          {errorMsg ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {errorMsg}
            </div>
          ) : null}

          {/* Structural Diff vs Published */}
          <div className="rounded-md border border-zinc-200 bg-[#FAF9F6] p-4">
            <p className="text-xs font-semibold text-[#111111]">
              {pageMeta.published_revision_id
                ? 'Changes compared to currently live version'
                : 'Initial Publication Summary'}
            </p>
            {baselineQuery.isLoading ? (
              <p className="mt-2 text-xs text-zinc-500">Comparing draft against live snapshot…</p>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <div className="rounded border border-zinc-200 bg-white p-2">
                  <p className="text-base font-semibold text-emerald-700 tabular-nums">
                    +{diff.addedCount}
                  </p>
                  <p className="text-[10px] text-zinc-500">Added</p>
                </div>
                <div className="rounded border border-zinc-200 bg-white p-2">
                  <p className="text-base font-semibold text-[#111111] tabular-nums">
                    {diff.modifiedCount}
                  </p>
                  <p className="text-[10px] text-zinc-500">Modified</p>
                </div>
                <div className="rounded border border-zinc-200 bg-white p-2">
                  <p className="text-base font-semibold text-zinc-700 tabular-nums">
                    {diff.reorderedCount}
                  </p>
                  <p className="text-[10px] text-zinc-500">Moved</p>
                </div>
                <div className="rounded border border-zinc-200 bg-white p-2">
                  <p className="text-base font-semibold text-red-700 tabular-nums">
                    -{diff.removedCount}
                  </p>
                  <p className="text-[10px] text-zinc-500">Removed</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="publish-summary"
              className="block text-xs font-semibold text-[#111111]"
            >
              Revision Release Note
            </label>
            <input
              id="publish-summary"
              type="text"
              disabled={!isSuperAdmin || publishMutation.isPending}
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="e.g. Updated Growth Bundle pricing copy and FAQ answers"
              className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 bg-[#FAF9F6] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-[#111111] hover:bg-zinc-50"
          >
            Cancel
          </button>
          {isSuperAdmin ? (
            <button
              type="button"
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {publishMutation.isPending ? 'Publishing…' : 'Confirm & Publish Live'}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
