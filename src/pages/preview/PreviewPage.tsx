import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  Monitor,
  Pencil,
  ShieldAlert,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { resolvePreviewPage } from '../../lib/revisionsApi';
import { PageRenderer } from '../../blocks/PageRenderer';
import type { ViewportMode } from '../../schemas/styles';
import { useAuth } from '../../providers/AuthProvider';

export default function PreviewPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const [searchParams] = useSearchParams();
  const rawToken = searchParams.get('token');
  const { isActiveStaff } = useAuth();
  const [viewport, setViewport] = useState<ViewportMode>('desktop');

  // Ensure search engines never index draft preview routes
  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    const previousContent = existing?.getAttribute('content') ?? null;

    let metaEl = existing as HTMLMetaElement | null;
    if (!metaEl) {
      metaEl = document.createElement('meta');
      metaEl.name = 'robots';
      document.head.appendChild(metaEl);
    }
    metaEl.content = 'noindex, nofollow';

    return () => {
      if (previousContent !== null && metaEl) {
        metaEl.content = previousContent;
      } else if (!existing && metaEl?.parentNode) {
        metaEl.parentNode.removeChild(metaEl);
      }
    };
  }, []);

  const previewQuery = useQuery({
    queryKey: ['draft-preview', pageId, rawToken],
    queryFn: () => resolvePreviewPage(pageId!, rawToken),
    enabled: Boolean(pageId),
    retry: false,
  });

  if (previewQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF9F6] text-sm text-zinc-600">
        <div className="mb-3 h-5 w-5 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
        Loading Klido draft preview…
      </div>
    );
  }

  if (previewQuery.isError || !previewQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6] p-6">
        <div className="max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-center">
          <AlertCircle className="mx-auto h-7 w-7 text-red-600" />
          <h1 className="mt-3 font-editorial text-lg font-semibold text-[#111111]">
            Preview Unavailable
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
            {previewQuery.error instanceof Error
              ? previewQuery.error.message
              : 'This preview link has expired or requires staff authentication.'}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Link
              to="/login"
              className="rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800"
            >
              Sign In to Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { page, tree, revisionNumber, expiresAt, mode } = previewQuery.data;

  const frameWidthClass =
    viewport === 'mobile'
      ? 'max-w-[390px] mx-auto shadow-md border-x border-zinc-200'
      : viewport === 'tablet'
        ? 'max-w-[768px] mx-auto shadow-md border-x border-zinc-200'
        : 'w-full';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111]">
      {/* Slim Non-Intrusive Preview Banner */}
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-[#111111] px-4 py-2.5 text-xs text-white">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <ShieldAlert className="h-3.5 w-3.5 text-[#C2F81A]" />
            Draft Preview
          </span>
          <span className="text-zinc-300">
            {page.title} ({page.slug}) · Rev #{revisionNumber}
          </span>
          {mode === 'token' && expiresAt ? (
            <span className="hidden text-zinc-400 sm:inline">
              · Expires {new Date(expiresAt).toLocaleString()}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded border border-zinc-700 bg-zinc-900 p-0.5">
            {(
              [
                { id: 'desktop', icon: Monitor, label: 'Desktop' },
                { id: 'tablet', icon: Tablet, label: 'Tablet' },
                { id: 'mobile', icon: Smartphone, label: 'Mobile' },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.label}
                  onClick={() => setViewport(item.id)}
                  className={`rounded p-1 ${
                    viewport === item.id ? 'bg-white text-[#111111]' : 'text-zinc-300'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>

          {isActiveStaff ? (
            <>
              <Link
                to={`/dashboard/builder/${page.id}`}
                className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-medium text-white hover:bg-zinc-800"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </Link>
              <Link
                to="/dashboard/pages"
                className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 font-medium text-white hover:bg-zinc-800"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Dashboard</span>
              </Link>
            </>
          ) : null}
        </div>
      </header>

      {/* Public Klido Page Preview */}
      <div className={`min-h-[calc(100vh-45px)] bg-white ${frameWidthClass}`}>
        <PageRenderer content={tree} viewport={viewport} />
      </div>
    </div>
  );
}
