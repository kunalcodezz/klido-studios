import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Plus, Save, Trash2, X } from 'lucide-react';
import {
  deleteRedirect,
  listRedirects,
  saveSiteSetting,
  upsertRedirect,
} from '../../lib/contentApi';
import {
  GlobalSettingsProvider,
  useGlobalSettings,
  type FooterConfig,
} from '../../providers/GlobalSettingsProvider';
import { useAuth } from '../../providers/AuthProvider';

function WebsiteSettingsInner() {
  const { canEdit, isSuperAdmin } = useAuth();
  const { footerConfig } = useGlobalSettings();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FooterConfig>(footerConfig);
  const [notice, setNotice] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [redirectModalOpen, setRedirectModalOpen] = useState(false);
  const [sourcePath, setSourcePath] = useState('/old-route');
  const [destPath, setDestPath] = useState('/services');
  const [statusCode, setStatusCode] = useState<301 | 302 | 307 | 308>(301);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setForm(footerConfig);
  }, [footerConfig]);

  const redirectsQuery = useQuery({
    queryKey: ['redirects-manager'],
    queryFn: listRedirects,
  });

  const saveConfigMutation = useMutation({
    mutationFn: () => saveSiteSetting('footer_config', form),
    onSuccess: async () => {
      setErrMsg(null);
      setNotice('Website contact & footer identity saved.');
      await queryClient.invalidateQueries({ queryKey: ['cms-global-settings'] });
    },
    onError: (err) => setErrMsg(err instanceof Error ? err.message : 'Unable to save settings.'),
  });

  const createRedirectMutation = useMutation({
    mutationFn: () =>
      upsertRedirect({
        source_path: sourcePath,
        destination_path: destPath,
        status_code: statusCode,
        is_active: true,
        notes,
      }),
    onSuccess: async () => {
      setErrMsg(null);
      setRedirectModalOpen(false);
      setSourcePath('/old-route');
      setDestPath('/services');
      setNotes('');
      await queryClient.invalidateQueries({ queryKey: ['redirects-manager'] });
    },
    onError: (err) => setErrMsg(err instanceof Error ? err.message : 'Unable to save redirect.'),
  });

  const deleteRedirectMutation = useMutation({
    mutationFn: deleteRedirect,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['redirects-manager'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Website Settings &amp; Redirects
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage Klido contact channels, footer identity, and URL redirect rules.
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            type="button"
            disabled={saveConfigMutation.isPending}
            onClick={() => saveConfigMutation.mutate()}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saveConfigMutation.isPending ? 'Saving…' : 'Save Settings'}</span>
          </button>
        ) : null}
      </div>

      {!isSuperAdmin ? (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <Lock className="h-4 w-4 shrink-0" />
          <span>Site-wide footer &amp; contact settings require SUPER_ADMIN privileges.</span>
        </div>
      ) : null}

      {notice ? <div className="rounded-md border border-zinc-200 bg-white px-4 py-3 text-xs">{notice}</div> : null}
      {errMsg ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{errMsg}</div> : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-[#111111]">Contact &amp; Footer Identity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#111111]">Agency Email</label>
            <input
              type="email"
              disabled={!isSuperAdmin}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111]">Phone Number</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111]">Instagram Handle</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.instagramHandle}
              onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111]">Instagram URL</label>
            <input
              type="url"
              disabled={!isSuperAdmin}
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111]">Hours</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111]">Location Label</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-[#111111]">Footer Description</label>
          <textarea
            rows={2}
            disabled={!isSuperAdmin}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#111111]">Copyright Notice</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.copyrightText}
              onChange={(e) => setForm({ ...form, copyrightText: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#111111]">Footer Tagline</label>
            <input
              type="text"
              disabled={!isSuperAdmin}
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* URL Redirects */}
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[#111111]">URL Redirect Rules</h2>
            <p className="text-xs text-zinc-500">HTTP 301/302/307/308 path forwarding for legacy slugs.</p>
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => setRedirectModalOpen(true)}
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Redirect</span>
            </button>
          ) : null}
        </div>

        {(redirectsQuery.data ?? []).length === 0 ? (
          <div className="px-6 py-8 text-center text-xs text-zinc-500">No redirect rules configured.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                  <th className="px-5 py-2.5">Source Path</th>
                  <th className="px-5 py-2.5">Destination</th>
                  <th className="px-5 py-2.5">Code</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(redirectsQuery.data ?? []).map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-mono text-xs text-[#111111]">{r.source_path}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-600">{r.destination_path}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-700">{r.status_code}</td>
                    <td className="px-5 py-3 text-right">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => deleteRedirectMutation.mutate(r.id)}
                          className="text-red-600 hover:text-red-700"
                          aria-label={`Delete redirect ${r.source_path}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {redirectModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="font-editorial text-lg font-semibold text-[#111111]">Add Redirect Rule</h2>
              <button type="button" onClick={() => setRedirectModalOpen(false)} className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Source Path</label>
                <input type="text" value={sourcePath} onChange={(e) => setSourcePath(e.target.value)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Destination Path / URL</label>
                <input type="text" value={destPath} onChange={(e) => setDestPath(e.target.value)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Status Code</label>
                <select value={statusCode} onChange={(e) => setStatusCode(Number(e.target.value) as 301 | 302 | 307 | 308)} className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm">
                  <option value={301}>301 — Permanent</option>
                  <option value={302}>302 — Temporary</option>
                  <option value={307}>307 — Temporary Preserve Method</option>
                  <option value={308}>308 — Permanent Preserve Method</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Notes</label>
                <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-[#FAF9F6] px-5 py-3.5">
              <button type="button" onClick={() => setRedirectModalOpen(false)} className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium">Cancel</button>
              <button type="button" disabled={createRedirectMutation.isPending} onClick={() => createRedirectMutation.mutate()} className="rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                {createRedirectMutation.isPending ? 'Saving…' : 'Save Redirect'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function WebsiteSettingsPage() {
  return (
    <GlobalSettingsProvider>
      <WebsiteSettingsInner />
    </GlobalSettingsProvider>
  );
}
