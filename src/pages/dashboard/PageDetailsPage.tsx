import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink, Globe, Pencil, Save } from 'lucide-react';
import { fetchPageForBuilder } from '../../lib/builderApi';
import {
  fetchPageRevisions,
  publishPageRevision,
  updatePageMetadata,
} from '../../lib/revisionsApi';
import { useAuth } from '../../providers/AuthProvider';
import { PublishProgressBar, type PublishPhase } from '../../components/ui/PublishProgressBar';
import type { PageType, SeoMetadata } from '../../types/database';

export default function PageDetailsPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const { canEdit, isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();

  const pageQuery = useQuery({
    queryKey: ['page-details', pageId],
    queryFn: () => fetchPageForBuilder(pageId!),
    enabled: Boolean(pageId),
  });

  const revisionsQuery = useQuery({
    queryKey: ['page-revisions', pageId],
    queryFn: () => fetchPageRevisions(pageId!),
    enabled: Boolean(pageId),
  });

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [pageType, setPageType] = useState<PageType>('standard');
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [seo, setSeo] = useState<SeoMetadata>({
    seoTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    robotsIndex: true,
    robotsFollow: true,
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [errText, setErrText] = useState<string | null>(null);
  const [publishPhase, setPublishPhase] = useState<PublishPhase>('idle');
  const [publishedRevNumber, setPublishedRevNumber] = useState<number | null>(null);

  useEffect(() => {
    if (pageQuery.data?.page) {
      const p = pageQuery.data.page;
      setTitle(p.title);
      setSlug(p.slug);
      setPageType(p.page_type);
      setStatus(p.status);
      setSeo({
        seoTitle: p.seo_metadata?.seoTitle ?? '',
        metaDescription: p.seo_metadata?.metaDescription ?? '',
        canonicalUrl: p.seo_metadata?.canonicalUrl ?? '',
        ogTitle: p.seo_metadata?.ogTitle ?? '',
        ogDescription: p.seo_metadata?.ogDescription ?? '',
        ogImage: p.seo_metadata?.ogImage ?? '',
        robotsIndex: p.seo_metadata?.robotsIndex ?? true,
        robotsFollow: p.seo_metadata?.robotsFollow ?? true,
      });
    }
  }, [pageQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updatePageMetadata(pageId!, {
        title,
        slug,
        page_type: pageType,
        status,
        seo_metadata: seo,
      }),
    onSuccess: async () => {
      setErrText(null);
      setNotice('Page settings & SEO metadata saved.');
      await queryClient.invalidateQueries({ queryKey: ['page-details', pageId] });
      await queryClient.invalidateQueries({ queryKey: ['pages-list'] });
    },
    onError: (err) => {
      setNotice(null);
      setErrText(err instanceof Error ? err.message : 'Unable to save page settings.');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      setErrText(null);
      setNotice(null);
      setPublishPhase('publishing');
      const rev = await publishPageRevision(
        pageId!,
        pageQuery.data?.draftRevisionId ?? null,
        'Published from Page Settings'
      );
      setPublishPhase('syncing');
      return rev;
    },
    onSuccess: async (rev) => {
      setErrText(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['page-details', pageId] }),
        queryClient.invalidateQueries({ queryKey: ['page-revisions', pageId] }),
        queryClient.invalidateQueries({ queryKey: ['pages-list'] }),
      ]);
      setPublishedRevNumber(rev.revision_number);
      setPublishPhase('complete');
      setNotice(`Published Revision #${rev.revision_number} live.`);
      window.setTimeout(() => {
        setPublishPhase('idle');
      }, 2500);
    },
    onError: (err) => {
      setPublishPhase('idle');
      setPublishedRevNumber(null);
      setNotice(null);
      setErrText(err instanceof Error ? err.message : 'Publish failed.');
    },
  });

  if (pageQuery.isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-zinc-200/70" />;
  }

  if (pageQuery.isError || !pageQuery.data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {pageQuery.error instanceof Error ? pageQuery.error.message : 'Page not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <Link
            to="/dashboard/pages"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-[#111111]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Pages
          </Link>
          <h1 className="mt-2 font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            {pageQuery.data.page.title} — Settings &amp; SEO
          </h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">{pageQuery.data.page.slug}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/preview/${pageId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-[#111111] hover:bg-zinc-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Draft Preview</span>
          </Link>
          <Link
            to={`/dashboard/builder/${pageId}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-[#111111] hover:bg-zinc-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Open Visual Builder</span>
          </Link>
          {isSuperAdmin ? (
            <button
              type="button"
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{publishMutation.isPending ? 'Publishing…' : 'Publish Draft'}</span>
            </button>
          ) : null}
        </div>
      </div>

      <PublishProgressBar
        phase={publishPhase}
        label={
          publishPhase === 'complete' && publishedRevNumber
            ? `Published Revision #${publishedRevNumber} live`
            : undefined
        }
      />

      {notice ? (
        <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs text-[#111111]">
          {notice}
        </div>
      ) : null}
      {errText ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {errText}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Route & SEO Editor */}
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-[#111111]">Route Configuration</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Page Title</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">
                  Approved Route Slug (Locked)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={slug}
                  className="mt-1.5 w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 font-mono text-sm text-zinc-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Page Type</label>
                <select
                  disabled
                  value={pageType}
                  className="mt-1.5 w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600"
                >
                  <option value="home">Home</option>
                  <option value="services">Services</option>
                  <option value="approach">Approach</option>
                  <option value="contact">Contact</option>
                  <option value="about">About</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Status</label>
                <select
                  disabled={!canEdit}
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as 'draft' | 'published')
                  }
                  className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-[#111111]">Search &amp; Open Graph SEO</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111]">SEO Title</label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={seo.seoTitle}
                  onChange={(e) => setSeo({ ...seo, seoTitle: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  disabled={!canEdit}
                  value={seo.metaDescription}
                  onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                  className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">
                    Canonical URL
                  </label>
                  <input
                    type="url"
                    disabled={!canEdit}
                    value={seo.canonicalUrl}
                    onChange={(e) => setSeo({ ...seo, canonicalUrl: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">
                    Open Graph Image URL
                  </label>
                  <input
                    type="url"
                    disabled={!canEdit}
                    value={seo.ogImage}
                    onChange={(e) => setSeo({ ...seo, ogImage: e.target.value })}
                    className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#111111]">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={seo.robotsIndex}
                    onChange={(e) => setSeo({ ...seo, robotsIndex: e.target.checked })}
                    className="h-4 w-4 accent-[#111111]"
                  />
                  <span>Allow indexing (robots index)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#111111]">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={seo.robotsFollow}
                    onChange={(e) => setSeo({ ...seo, robotsFollow: e.target.checked })}
                    className="h-4 w-4 accent-[#111111]"
                  />
                  <span>Allow link following</span>
                </label>
              </div>
            </div>

            {canEdit ? (
              <div className="mt-5 flex justify-end border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saveMutation.isPending ? 'Saving…' : 'Save Settings'}</span>
                </button>
              </div>
            ) : null}
          </section>
        </div>

        {/* Google Snippet Preview + Page Revisions */}
        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-[#111111]">Search Snippet Preview</h2>
            <div className="mt-3 rounded-md border border-zinc-200 bg-[#FAF9F6] p-4">
              <p className="truncate text-xs text-zinc-500">
                {seo.canonicalUrl || `https://www.klido.in${slug === '/' ? '' : slug}`}
              </p>
              <p className="mt-1 truncate text-base font-medium text-[#123FFF]">
                {seo.seoTitle || title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600">
                {seo.metaDescription ||
                  'Add a clear meta description summarizing this Klido page for search results.'}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#111111]">Page Revisions</h2>
              <Link
                to="/dashboard/revisions"
                className="text-xs font-medium text-zinc-600 hover:text-[#111111] hover:underline"
              >
                All revisions
              </Link>
            </div>
            <div className="mt-4 divide-y divide-zinc-100">
              {(revisionsQuery.data ?? []).slice(0, 8).map((rev) => (
                <div key={rev.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="min-w-0 pr-3">
                    <p className="truncate font-medium text-[#111111]">
                      Rev #{rev.revision_number} ·{' '}
                      <span className="capitalize">{rev.status}</span>
                    </p>
                    <p className="truncate text-zinc-500">{rev.change_summary || 'Snapshot'}</p>
                  </div>
                  <span className="shrink-0 tabular-nums text-zinc-400">
                    {new Date(rev.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {(revisionsQuery.data ?? []).length === 0 ? (
                <p className="py-4 text-xs text-zinc-500">No revisions yet.</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
