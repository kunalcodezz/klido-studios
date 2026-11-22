import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Copy,
  Image as ImageIcon,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import { listMediaAssets, updateMediaAltText } from '../../lib/contentApi';
import {
  checkMediaAssetUsage,
  deleteMediaAssetSafely,
  uploadMediaAsset,
} from '../../lib/storage';
import { useAuth } from '../../providers/AuthProvider';
import type { MediaAsset, MediaUsageResult } from '../../types/database';

export default function MediaLibraryPage() {
  const { canEdit, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [altTextDraft, setAltTextDraft] = useState('');
  const [usageInfo, setUsageInfo] = useState<MediaUsageResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['media-library'],
    queryFn: listMediaAssets,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList | File[]) => {
      const list = Array.from(files);
      for (const f of list) {
        await uploadMediaAsset(f, f.name.replace(/\.[^.]+$/, ''));
      }
    },
    onSuccess: async () => {
      setBannerError(null);
      await queryClient.invalidateQueries({ queryKey: ['media-library'] });
      await queryClient.invalidateQueries({ queryKey: ['media-picker-assets'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
    onError: (err) => {
      setBannerError(err instanceof Error ? err.message : 'Upload failed.');
    },
  });

  const altMutation = useMutation({
    mutationFn: () => updateMediaAltText(selectedAsset!.id, altTextDraft),
    onSuccess: async (updated) => {
      setBannerError(null);
      setSelectedAsset(updated);
      await queryClient.invalidateQueries({ queryKey: ['media-library'] });
    },
    onError: (err) => setBannerError(err instanceof Error ? err.message : 'Failed to update alt text.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMediaAssetSafely,
    onSuccess: async () => {
      setBannerError(null);
      setSelectedAsset(null);
      await queryClient.invalidateQueries({ queryKey: ['media-library'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
    onError: (err) => setBannerError(err instanceof Error ? err.message : 'Cannot delete media asset.'),
  });

  const inspectAsset = async (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setAltTextDraft(asset.alt_text);
    setUsageInfo(null);
    try {
      const usage = await checkMediaAssetUsage(asset.id);
      setUsageInfo(usage);
    } catch {
      setUsageInfo(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesType = typeFilter === 'all' || a.file_type === typeFilter;
      const matchesSearch =
        !q ||
        a.file_name.toLowerCase().includes(q) ||
        a.alt_text.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [assets, search, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Media Library
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage images and videos in <code>klido-media</code> with alt-text metadata and safe usage checks.
          </p>
        </div>

        {canEdit ? (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800">
            <Upload className="h-3.5 w-3.5" />
            <span>{uploadMutation.isPending ? 'Uploading…' : 'Upload Media'}</span>
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/avif,image/gif,video/mp4,video/webm"
              disabled={uploadMutation.isPending}
              onChange={(e) => {
                if (e.target.files?.length) uploadMutation.mutate(e.target.files);
              }}
              className="sr-only"
            />
          </label>
        ) : null}
      </div>

      {bannerError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {bannerError}
        </div>
      ) : null}

      {canEdit ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.length) {
              uploadMutation.mutate(e.dataTransfer.files);
            }
          }}
          className={`rounded-lg border border-dashed px-6 py-6 text-center transition-colors ${
            dragActive
              ? 'border-[#111111] bg-white'
              : 'border-zinc-300 bg-white/70'
          }`}
        >
          <p className="text-xs font-medium text-[#111111]">
            Drag and drop PNG, JPG, WebP, AVIF, GIF, MP4, or WebM files here
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            Maximum 10 MB per file · SVG uploads are disabled for security.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search filename or alt text…"
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1">
          {(['all', 'image', 'video'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded px-3 py-1 text-xs font-medium capitalize ${
                typeFilter === t ? 'bg-[#111111] text-white' : 'text-zinc-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-zinc-200/70" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <ImageIcon className="mx-auto h-7 w-7 text-zinc-300" />
          <p className="mt-2 text-sm font-medium text-[#111111]">No media assets found</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              onClick={() => void inspectAsset(asset)}
              className="cursor-pointer overflow-hidden rounded-lg border border-zinc-200 bg-white transition-colors hover:border-[#111111]"
            >
              <div className="aspect-[16/10] bg-zinc-100">
                {asset.file_type === 'image' ? (
                  <img
                    src={asset.public_url}
                    alt={asset.alt_text || asset.file_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-500">
                    <Video className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-semibold text-[#111111]">{asset.file_name}</p>
                <p className="mt-0.5 text-[11px] tabular-nums text-zinc-500">
                  {Math.round(asset.file_size / 1024)} KB
                  {asset.dimensions?.width ? ` · ${asset.dimensions.width}×${asset.dimensions.height}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAsset ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="truncate font-editorial text-lg font-semibold text-[#111111]">
                {selectedAsset.file_name}
              </h2>
              <button type="button" onClick={() => setSelectedAsset(null)} className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              {selectedAsset.file_type === 'image' ? (
                <img
                  src={selectedAsset.public_url}
                  alt={selectedAsset.alt_text || selectedAsset.file_name}
                  className="max-h-56 w-full rounded border border-zinc-200 object-contain bg-zinc-50"
                />
              ) : null}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={selectedAsset.public_url}
                  className="min-w-0 flex-1 rounded border border-zinc-300 bg-[#FAF9F6] px-2.5 py-1.5 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(selectedAsset.public_url);
                    setCopiedId(selectedAsset.id);
                    setTimeout(() => setCopiedId(null), 1500);
                  }}
                  className="inline-flex items-center gap-1 rounded border border-zinc-300 px-2.5 py-1.5 text-xs font-medium"
                >
                  {copiedId === selectedAsset.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId === selectedAsset.id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">Alt Text</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={altTextDraft}
                    onChange={(e) => setAltTextDraft(e.target.value)}
                    className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-1.5 text-xs"
                  />
                  {canEdit ? (
                    <button
                      type="button"
                      disabled={altMutation.isPending}
                      onClick={() => altMutation.mutate()}
                      className="rounded bg-[#111111] px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Save Alt
                    </button>
                  ) : null}
                </div>
              </div>

              {usageInfo ? (
                <div className="rounded border border-zinc-200 bg-[#FAF9F6] p-3 text-xs text-zinc-700">
                  Usage: <strong>{usageInfo.published_refs}</strong> published page ref(s),{' '}
                  <strong>{usageInfo.collection_refs}</strong> content collection ref(s).
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-200 bg-[#FAF9F6] px-5 py-3.5">
              {isSuperAdmin ? (
                <button
                  type="button"
                  disabled={deleteMutation.isPending || Boolean(usageInfo?.in_use)}
                  onClick={() => deleteMutation.mutate(selectedAsset)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{usageInfo?.in_use ? 'In Use (Cannot Delete)' : 'Delete Asset'}</span>
                </button>
              ) : <span />}
              <button type="button" onClick={() => setSelectedAsset(null)} className="rounded border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
