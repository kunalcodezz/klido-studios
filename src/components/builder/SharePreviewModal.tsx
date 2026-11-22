import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Check, Copy, ExternalLink, Link2, ShieldCheck, X } from 'lucide-react';
import { createExpiringPreviewLink } from '../../lib/revisionsApi';
import { saveBuilderDraft } from '../../lib/builderApi';
import { useEditorStore } from '../../stores/editorStore';
import { useAuth } from '../../providers/AuthProvider';

interface SharePreviewModalProps {
  open: boolean;
  onClose: () => void;
}

export function SharePreviewModal({ open, onClose }: SharePreviewModalProps) {
  const { canEdit } = useAuth();
  const { pageId, pageMeta, draftRevisionId, content, isDirty, markSaved } =
    useEditorStore();
  const [ttlHours, setTtlHours] = useState<number>(24);
  const [generatedLink, setGeneratedLink] = useState<{
    previewPath: string;
    fullUrl: string;
    expiresAt: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!pageId) throw new Error('Missing page ID.');
      let activeDraftId = draftRevisionId;

      if (isDirty || !activeDraftId) {
        const saved = await saveBuilderDraft(
          pageId,
          draftRevisionId,
          content,
          'Draft snapshot for expiring preview'
        );
        activeDraftId = saved.revisionId;
        markSaved(saved.revisionId);
      }

      return createExpiringPreviewLink(pageId, activeDraftId, ttlHours);
    },
    onSuccess: (res) => {
      setErrMsg(null);
      setGeneratedLink(res);
    },
    onError: (err) => {
      setErrMsg(err instanceof Error ? err.message : 'Unable to generate preview link.');
    },
  });

  if (!open || !pageId || !pageMeta) return null;

  const copyLink = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink.fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Draft preview options"
    >
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[#111111]" />
            <h2 className="font-editorial text-lg font-semibold text-[#111111]">
              Draft Preview &amp; Sharing
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview modal"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-md border border-zinc-200 bg-[#FAF9F6] p-3.5">
            <p className="text-xs font-semibold text-[#111111]">Staff Draft Preview</p>
            <p className="mt-1 text-xs text-zinc-600">
              Open the dedicated draft preview route (includes <code>noindex, nofollow</code>{' '}
              protection).
            </p>
            <Link
              to={`/preview/${pageId}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-zinc-50"
            >
              <span>Open Staff Preview</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {canEdit ? (
            <div className="space-y-3 rounded-md border border-zinc-200 p-3.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111111]">
                <ShieldCheck className="h-4 w-4" />
                <span>Shareable Expiring Review Link</span>
              </div>
              <p className="text-xs text-zinc-600">
                Generates a SHA-256 hashed token allowing stakeholders to review this draft without
                publishing it live.
              </p>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Expiration window"
                  value={ttlHours}
                  onChange={(e) => setTtlHours(Number(e.target.value))}
                  className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-[#111111]"
                >
                  <option value={1}>Expires in 1 hour</option>
                  <option value={24}>Expires in 24 hours</option>
                  <option value={168}>Expires in 7 days</option>
                </select>

                <button
                  type="button"
                  disabled={generateMutation.isPending}
                  onClick={() => generateMutation.mutate()}
                  className="flex-1 rounded-md bg-[#111111] px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {generateMutation.isPending ? 'Generating…' : 'Generate Link'}
                </button>
              </div>

              {errMsg ? <p className="text-xs text-red-600">{errMsg}</p> : null}

              {generatedLink ? (
                <div className="space-y-2 rounded border border-zinc-200 bg-[#FAF9F6] p-2.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink.fullUrl}
                      className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 font-mono text-[11px] text-[#111111]"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="inline-flex items-center gap-1 rounded border border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-[#111111] hover:bg-zinc-50"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>
                      Valid until {new Date(generatedLink.expiresAt).toLocaleString()}
                    </span>
                    <Link
                      to={generatedLink.previewPath}
                      className="font-semibold text-[#111111] hover:underline"
                    >
                      Open Token Preview
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
