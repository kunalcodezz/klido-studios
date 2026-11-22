import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import {
  deleteReusableSectionTemplate,
  fetchPageForBuilder,
  fetchSavedSections,
  OptimisticConcurrencyError,
  saveBuilderDraft,
  saveReusableSectionTemplate,
} from '../../lib/builderApi';
import { useAuth } from '../../providers/AuthProvider';
import { useEditorStore } from '../../stores/editorStore';
import { useUiStore } from '../../stores/uiStore';
import { BuilderToolbar } from '../../components/builder/BuilderToolbar';
import { LeftLayersPanel } from '../../components/builder/LeftLayersPanel';
import { CenterCanvas } from '../../components/builder/CenterCanvas';
import { RightInspectorPanel } from '../../components/builder/RightInspectorPanel';
import { PublishModal } from '../../components/builder/PublishModal';
import { SharePreviewModal } from '../../components/builder/SharePreviewModal';
import type { BlockNode } from '../../schemas/blocks';

const AUTOSAVE_DEBOUNCE_MS = 1500;

export default function BuilderPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const { canEdit, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const {
    loadPage,
    resetEditor,
    content,
    draftRevisionId,
    isDirty,
    conflictDetected,
    fullPreview,
    undo,
    redo,
    markSaved,
    setConflictDetected,
  } = useEditorStore();

  const { saveStatus, setSaveStatus } = useUiStore();
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [sharePreviewOpen, setSharePreviewOpen] = useState(false);

  const pageQuery = useQuery({
    queryKey: ['builder-page', pageId],
    queryFn: () => fetchPageForBuilder(pageId!),
    enabled: Boolean(pageId),
  });

  const savedSectionsQuery = useQuery({
    queryKey: ['saved-sections'],
    queryFn: fetchSavedSections,
  });

  useEffect(() => {
    if (pageQuery.data) {
      loadPage(
        pageQuery.data.page,
        pageQuery.data.tree,
        pageQuery.data.draftRevisionId
      );
      setSaveStatus('idle');
    }
    return () => {
      resetEditor();
    };
  }, [pageQuery.data, loadPage, resetEditor, setSaveStatus]);

  useEffect(() => {
    if (isDirty) {
      setSaveStatus('unsaved');
    }
  }, [isDirty, setSaveStatus]);

  // Browser navigation protection for unsaved edits
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const saveMutation = useMutation({
    mutationFn: async (summary: string = 'Draft autosave') => {
      if (!pageId) throw new Error('Missing page ID.');
      setSaveStatus('saving');
      return saveBuilderDraft(pageId, draftRevisionId, content, summary);
    },
    onSuccess: async (res) => {
      setBannerError(null);
      markSaved(res.revisionId);
      setSaveStatus('saved');
      await queryClient.invalidateQueries({ queryKey: ['pages-list'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      await queryClient.invalidateQueries({ queryKey: ['page-revisions'] });
    },
    onError: (err) => {
      if (err instanceof OptimisticConcurrencyError) {
        setConflictDetected(true);
      }
      setSaveStatus('error');
      setBannerError(err instanceof Error ? err.message : 'Unable to save draft.');
    },
  });

  // Debounced 1.5s automatic draft persistence
  useEffect(() => {
    if (!canEdit || !isDirty || conflictDetected || saveMutation.isPending) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveMutation.mutate('Draft autosave');
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [canEdit, isDirty, conflictDetected, content, saveMutation]);

  const handleSave = useCallback(() => {
    if (!canEdit || !isDirty || saveMutation.isPending || conflictDetected) return;
    saveMutation.mutate('Manual draft save');
  }, [canEdit, isDirty, saveMutation, conflictDetected]);

  const handleSaveTemplate = async (block: BlockNode) => {
    try {
      setBannerError(null);
      await saveReusableSectionTemplate(block.name, block.type, block);
      await queryClient.invalidateQueries({ queryKey: ['saved-sections'] });
      setBannerNotice(`Saved "${block.name}" to Reusable Sections.`);
      setTimeout(() => setBannerNotice(null), 3500);
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Unable to save section template.');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteReusableSectionTemplate(id);
      await queryClient.invalidateQueries({ queryKey: ['saved-sections'] });
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Unable to remove saved section.');
    }
  };

  // Global keyboard shortcuts (Undo, Redo, Save)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          Boolean(target.closest('.ProseMirror')));

      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      if (isTypingTarget || !canEdit) return;

      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.key.toLowerCase() === 'z' && e.shiftKey) ||
        e.key.toLowerCase() === 'y'
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canEdit, undo, redo, handleSave]);

  if (pageQuery.isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#FAF9F6] text-sm text-zinc-600">
        <div className="mb-3 h-5 w-5 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
        Loading Klido Visual Builder…
      </div>
    );
  }

  if (pageQuery.isError || !pageQuery.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF9F6] p-6">
        <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center">
          <AlertCircle className="mx-auto h-7 w-7 text-red-600" />
          <h1 className="mt-3 font-editorial text-lg font-semibold text-[#111111]">
            Unable to open page in builder
          </h1>
          <p className="mt-1.5 text-xs text-zinc-600">
            {pageQuery.error instanceof Error
              ? pageQuery.error.message
              : 'The requested page could not be loaded.'}
          </p>
          <Link
            to="/dashboard/pages"
            className="mt-5 inline-flex rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
          >
            Return to Pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAF9F6] text-[#111111]">
      <BuilderToolbar
        canEdit={canEdit}
        isSuperAdmin={isSuperAdmin}
        saveStatus={saveStatus}
        onSaveDraft={handleSave}
        onReloadLatest={() => {
          void pageQuery.refetch();
        }}
        onOpenSharePreview={() => setSharePreviewOpen(true)}
        onOpenPublishModal={() => setPublishOpen(true)}
      />

      {bannerError ? (
        <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          <span>{bannerError}</span>
          <button
            type="button"
            onClick={() => setBannerError(null)}
            className="font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {bannerNotice ? (
        <div className="border-b border-zinc-200 bg-white px-4 py-2 text-xs text-[#111111]">
          {bannerNotice}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {!fullPreview ? (
          <LeftLayersPanel
            canEdit={canEdit}
            savedSections={savedSectionsQuery.data ?? []}
            onSaveSelectedAsTemplate={handleSaveTemplate}
            onDeleteSavedTemplate={handleDeleteTemplate}
          />
        ) : null}

        <CenterCanvas canEdit={canEdit} />

        {!fullPreview ? (
          <RightInspectorPanel
            canEdit={canEdit}
            onSaveSectionTemplate={handleSaveTemplate}
          />
        ) : null}
      </div>

      <SharePreviewModal
        open={sharePreviewOpen}
        onClose={() => setSharePreviewOpen(false)}
      />

      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublishedSuccess={(revNum) => {
          setBannerNotice(`Published Revision #${revNum} live.`);
          setTimeout(() => setBannerNotice(null), 4000);
        }}
      />
    </div>
  );
}
