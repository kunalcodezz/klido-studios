import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Upload, Video, X } from 'lucide-react';
import { fetchMediaAssetsForPicker } from '../../lib/builderApi';
import { uploadMediaAsset } from '../../lib/storage';
import { useAuth } from '../../providers/AuthProvider';

interface MediaPickerModalProps {
  open: boolean;
  filterType?: 'image' | 'video' | 'all';
  onClose: () => void;
  onSelect: (publicUrl: string, altText?: string) => void;
}

export function MediaPickerModal({
  open,
  filterType = 'all',
  onClose,
  onSelect,
}: MediaPickerModalProps) {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['media-picker-assets'],
    queryFn: fetchMediaAssetsForPicker,
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => uploadMediaAsset(file, file.name.replace(/\.[^.]+$/, '')),
    onSuccess: async (asset) => {
      setUploadError(null);
      await queryClient.invalidateQueries({ queryKey: ['media-picker-assets'] });
      onSelect(asset.public_url, asset.alt_text);
      onClose();
    },
    onError: (err) => {
      setUploadError(err instanceof Error ? err.message : 'Media upload failed.');
    },
  });

  if (!open) return null;

  const filtered = assets.filter((a) =>
    filterType === 'all' ? true : a.file_type === filterType
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Select media asset"
    >
      <div className="flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="font-editorial text-lg font-semibold text-[#111111]">
              Klido Media Library
            </h2>
            <p className="text-xs text-zinc-500">
              Select an existing asset or upload directly to <code>klido-media</code> (max 10 MB, no SVG).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media picker"
            className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-[#111111]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-100 bg-[#FAF9F6] px-5 py-3">
          <span className="text-xs text-zinc-600">
            Showing {filtered.length} asset(s)
          </span>
          {canEdit ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[#111111] px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{uploadMutation.isPending ? 'Uploading…' : 'Upload File'}</span>
              <input
                type="file"
                accept={
                  filterType === 'video'
                    ? 'video/mp4,video/webm'
                    : filterType === 'image'
                      ? 'image/png,image/jpeg,image/webp,image/avif,image/gif'
                      : 'image/png,image/jpeg,image/webp,image/avif,image/gif,video/mp4,video/webm'
                }
                disabled={uploadMutation.isPending}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadMutation.mutate(file);
                }}
                className="sr-only"
              />
            </label>
          ) : null}
        </div>

        {uploadError ? (
          <div className="border-b border-red-200 bg-red-50 px-5 py-2.5 text-xs text-red-700">
            {uploadError}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-36 animate-pulse rounded-md bg-zinc-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 px-6 py-12 text-center">
              <ImageIcon className="mx-auto h-7 w-7 text-zinc-400" aria-hidden="true" />
              <p className="mt-2 text-sm font-medium text-[#111111]">No media assets found</p>
              <p className="mt-1 text-xs text-zinc-500">
                Upload an image or video above, or paste a direct HTTPS media URL in the inspector.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {filtered.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset.public_url, asset.alt_text);
                    onClose();
                  }}
                  className="group overflow-hidden rounded-md border border-zinc-200 bg-white text-left transition-colors hover:border-[#111111]"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-zinc-100">
                    {asset.file_type === 'image' ? (
                      <img
                        src={asset.public_url}
                        alt={asset.alt_text || asset.file_name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        <Video className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-xs font-medium text-[#111111]">
                      {asset.file_name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                      {Math.round(asset.file_size / 1024)} KB · {asset.file_type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
