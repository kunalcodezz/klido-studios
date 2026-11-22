import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Copy, Lock, Save } from 'lucide-react';
import { fetchAllPages } from '../../lib/dashboardApi';
import { generateSitemapXml, saveSiteSetting } from '../../lib/contentApi';
import {
  GlobalSettingsProvider,
  useGlobalSettings,
  type SeoGlobalConfig,
} from '../../providers/GlobalSettingsProvider';
import { useAuth } from '../../providers/AuthProvider';

function SeoManagerInner() {
  const { isSuperAdmin } = useAuth();
  const { seoGlobal } = useGlobalSettings();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<SeoGlobalConfig>(seoGlobal);
  const [notice, setNotice] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [copiedSitemap, setCopiedSitemap] = useState(false);

  useEffect(() => {
    setForm(seoGlobal);
  }, [seoGlobal]);

  const pagesQuery = useQuery({
    queryKey: ['pages-list'],
    queryFn: fetchAllPages,
  });

  const saveMutation = useMutation({
    mutationFn: () => saveSiteSetting('seo_global', form),
    onSuccess: async () => {
      setErrMsg(null);
      setNotice('Global SEO & robots.txt settings saved.');
      await queryClient.invalidateQueries({ queryKey: ['cms-global-settings'] });
    },
    onError: (err) => setErrMsg(err instanceof Error ? err.message : 'Unable to save SEO settings.'),
  });

  const sitemapXml = useMemo(
    () => generateSitemapXml(form.siteUrl || 'https://www.klido.in', pagesQuery.data ?? []),
    [form.siteUrl, pagesQuery.data]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            SEO Management
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Configure global search defaults, <code>robots.txt</code>, and inspect per-page metadata.
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saveMutation.isPending ? 'Saving…' : 'Save Global SEO'}</span>
          </button>
        ) : null}
      </div>

      {!isSuperAdmin ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Global SEO settings require SUPER_ADMIN access. Editors can still customize per-page SEO on individual pages.</span>
        </div>
      ) : null}

      {notice ? <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs">{notice}</div> : null}
      {errMsg ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errMsg}</div> : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 lg:col-span-7">
          <h2 className="text-sm font-semibold text-[#111111]">Global Search &amp; Open Graph Defaults</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#111111]">Site Name</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={form.siteName}
                onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111111]">Canonical Base URL</label>
              <input
                type="url"
                disabled={!isSuperAdmin}
                value={form.siteUrl}
                onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111]">Default Title</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.defaultTitle}
              onChange={(e) => setForm({ ...form, defaultTitle: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111]">Default Meta Description</label>
            <textarea
              rows={2}
              disabled={!isSuperAdmin}
              value={form.defaultMetaDescription}
              onChange={(e) => setForm({ ...form, defaultMetaDescription: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#111111]">Default OG Image URL</label>
              <input
                type="url"
                disabled={!isSuperAdmin}
                value={form.defaultOgImage}
                onChange={(e) => setForm({ ...form, defaultOgImage: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111111]">Favicon Path / URL</label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={form.faviconUrl}
                onChange={(e) => setForm({ ...form, faviconUrl: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111111]">robots.txt Directives</label>
            <textarea
              rows={4}
              disabled={!isSuperAdmin}
              value={form.robotsTxt}
              onChange={(e) => setForm({ ...form, robotsTxt: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs"
            />
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#111111]">Generated sitemap.xml</h2>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(sitemapXml);
                setCopiedSitemap(true);
                setTimeout(() => setCopiedSitemap(false), 1800);
              }}
              className="inline-flex items-center gap-1 rounded border border-zinc-300 px-2.5 py-1 text-xs font-medium"
            >
              {copiedSitemap ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSitemap ? 'Copied' : 'Copy XML'}</span>
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Dynamically reflects published, indexable pages (no hash URLs).
          </p>
          <pre className="mt-3 max-h-[300px] overflow-auto rounded border border-zinc-200 bg-[#FAF9F6] p-3 font-mono text-[11px] leading-relaxed text-zinc-700">
            {sitemapXml}
          </pre>
        </section>
      </div>

      {/* Per-page SEO coverage */}
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-[#111111]">Per-Page SEO Coverage</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                <th className="px-5 py-3">Page</th>
                <th className="px-5 py-3">SEO Title</th>
                <th className="px-5 py-3">Meta Description</th>
                <th className="px-5 py-3 text-right">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(pagesQuery.data ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-[#111111]">{p.title}</p>
                    <p className="font-mono text-[11px] text-zinc-500">{p.slug}</p>
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 text-xs text-zinc-700">
                    {p.seo_metadata?.seoTitle || 'Missing'}
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 text-xs text-zinc-600">
                    {p.seo_metadata?.metaDescription || 'Missing'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/dashboard/pages/${p.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#111111] hover:underline"
                    >
                      <span>Configure</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default function SeoManagerPage() {
  return (
    <GlobalSettingsProvider>
      <SeoManagerInner />
    </GlobalSettingsProvider>
  );
}
