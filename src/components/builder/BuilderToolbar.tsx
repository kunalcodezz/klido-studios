import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  EyeOff,
  Globe,
  History,
  Link2,
  Monitor,
  Redo2,
  Save,
  Settings,
  Smartphone,
  Tablet,
  Undo2,
} from 'lucide-react';
import { useEditorStore, type ZoomLevel } from '../../stores/editorStore';
import { useHistoryStore } from '../../stores/historyStore';
import type { SaveStatus } from '../../stores/uiStore';

interface BuilderToolbarProps {
  canEdit: boolean;
  isSuperAdmin: boolean;
  saveStatus: SaveStatus;
  onSaveDraft: () => void;
  onReloadLatest: () => void;
  onOpenSharePreview: () => void;
  onOpenPublishModal: () => void;
}

export function BuilderToolbar({
  canEdit,
  isSuperAdmin,
  saveStatus,
  onSaveDraft,
  onReloadLatest,
  onOpenSharePreview,
  onOpenPublishModal,
}: BuilderToolbarProps) {
  const {
    pageId,
    pageMeta,
    viewport,
    zoom,
    fullPreview,
    isDirty,
    conflictDetected,
    setViewport,
    setZoom,
    toggleFullPreview,
    undo,
    redo,
  } = useEditorStore();

  const canUndo = useHistoryStore((s) => s.past.length > 0);
  const canRedo = useHistoryStore((s) => s.future.length > 0);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4">
      {/* Left: Back & Page Context */}
      <div className="flex min-w-0 items-center gap-2.5">
        <Link
          to="/dashboard/pages"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-[#FAF9F6] px-2.5 py-1.5 text-xs font-medium text-[#111111] hover:bg-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Pages</span>
        </Link>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold text-[#111111]">
              {pageMeta?.title ?? 'Visual Builder'}
            </h1>
            {pageMeta?.slug ? (
              <span className="hidden font-mono text-[11px] text-zinc-500 md:inline">
                {pageMeta.slug}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-zinc-500">
            {conflictDetected ? (
              <span className="font-medium text-red-600">
                Draft modified elsewhere — reload before saving
              </span>
            ) : saveStatus === 'saving' ? (
              'Autosaving draft…'
            ) : isDirty ? (
              'Unsaved changes (autosaves in 1.5s)'
            ) : saveStatus === 'saved' ? (
              'Draft saved'
            ) : (
              `Status: ${pageMeta?.status ?? 'draft'}`
            )}
          </p>
        </div>
      </div>

      {/* Center: Undo/Redo + Viewport + Zoom */}
      <div className="hidden items-center gap-2 lg:flex">
        <div className="flex items-center rounded-md border border-zinc-200 bg-[#FAF9F6] p-0.5">
          <button
            type="button"
            disabled={!canEdit || !canUndo}
            onClick={undo}
            title="Undo (Ctrl/Cmd + Z)"
            aria-label="Undo"
            className="rounded p-1.5 text-zinc-700 hover:bg-white disabled:opacity-35"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canEdit || !canRedo}
            onClick={redo}
            title="Redo (Ctrl/Cmd + Shift + Z)"
            aria-label="Redo"
            className="rounded p-1.5 text-zinc-700 hover:bg-white disabled:opacity-35"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center rounded-md border border-zinc-200 bg-[#FAF9F6] p-0.5">
          {(
            [
              { id: 'desktop', icon: Monitor, label: 'Desktop' },
              { id: 'tablet', icon: Tablet, label: 'Tablet (768px)' },
              { id: 'mobile', icon: Smartphone, label: 'Mobile (390px)' },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                onClick={() => setViewport(item.id)}
                className={`rounded p-1.5 transition-colors ${
                  viewport === item.id
                    ? 'bg-[#111111] text-white'
                    : 'text-zinc-600 hover:text-[#111111]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <select
          aria-label="Canvas zoom"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value) as ZoomLevel)}
          className="rounded-md border border-zinc-200 bg-[#FAF9F6] px-2 py-1.5 text-xs font-medium text-[#111111] focus:border-[#111111] focus:outline-none"
        >
          <option value={0.5}>50%</option>
          <option value={0.75}>75%</option>
          <option value={1}>100%</option>
        </select>
      </div>

      {/* Right: Settings, Revisions, Preview, Save, Publish */}
      <div className="flex items-center gap-1.5">
        {conflictDetected ? (
          <button
            type="button"
            onClick={onReloadLatest}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Reload</span>
          </button>
        ) : null}

        {pageId ? (
          <Link
            to={`/dashboard/pages/${pageId}`}
            title="Page SEO & Settings"
            className="hidden rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-50 hover:text-[#111111] sm:inline-flex"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        ) : null}

        <Link
          to="/dashboard/revisions"
          title="Revision History"
          className="hidden rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-50 hover:text-[#111111] sm:inline-flex"
        >
          <History className="h-3.5 w-3.5" />
        </Link>

        <button
          type="button"
          onClick={toggleFullPreview}
          title="Toggle in-editor preview"
          className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
            fullPreview
              ? 'border-[#111111] bg-[#111111] text-white'
              : 'border-zinc-200 bg-white text-[#111111] hover:bg-zinc-50'
          }`}
        >
          {fullPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          <span className="hidden xl:inline">{fullPreview ? 'Edit' : 'Canvas'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenSharePreview}
          title="Open / Share Draft Preview Link"
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-[#111111] hover:bg-zinc-50"
        >
          <Link2 className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Preview</span>
        </button>

        {canEdit ? (
          <button
            type="button"
            disabled={saveStatus === 'saving' || !isDirty || conflictDetected}
            onClick={onSaveDraft}
            title="Save Draft (Ctrl/Cmd + S)"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-[#FAF9F6] px-2.5 py-1.5 text-xs font-medium text-[#111111] hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        ) : null}

        {isSuperAdmin ? (
          <button
            type="button"
            disabled={conflictDetected}
            onClick={onOpenPublishModal}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Publish</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenPublishModal}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-600"
          >
            <span>Publish</span>
          </button>
        )}
      </div>
    </header>
  );
}
