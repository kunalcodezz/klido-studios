import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { deleteProject, listProjects, upsertProject } from '../../lib/contentApi';
import { useAuth } from '../../providers/AuthProvider';
import type { ProjectRecord } from '../../types/database';

interface ProjectFormState {
  id?: string;
  title: string;
  slug: string;
  client_name: string;
  category: string;
  summary: string;
  description: string;
  external_url: string;
  metricsText: string;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
}

const EMPTY_FORM: ProjectFormState = {
  title: '',
  slug: '',
  client_name: '',
  category: 'Paid Acquisition',
  summary: '',
  description: '',
  external_url: '',
  metricsText: 'ROAS | 3.8x\nCAC Reduction | -28%',
  is_featured: false,
  is_visible: true,
  display_order: 0,
};

export default function ProjectsManagerPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormState>(EMPTY_FORM);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects-manager'],
    queryFn: listProjects,
  });

  const parseMetrics = (raw: string) =>
    raw
      .split('\n')
      .map((line) => line.split('|').map((s) => s.trim()))
      .filter((parts) => parts[0] && parts[1])
      .map(([label, value]) => ({ label, value }));

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertProject({
        id: form.id,
        title: form.title,
        slug: form.slug,
        client_name: form.client_name,
        category: form.category,
        summary: form.summary,
        description: form.description,
        cover_asset_id: null,
        external_url: form.external_url,
        metrics: parseMetrics(form.metricsText),
        is_featured: form.is_featured,
        is_visible: form.is_visible,
        display_order: Number(form.display_order) || 0,
      }),
    onSuccess: async () => {
      setErrMsg(null);
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['projects-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-collections-public'] });
    },
    onError: (err) => setErrMsg(err instanceof Error ? err.message : 'Unable to save project.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-collections-public'] });
    },
  });

  const openEdit = (p: ProjectRecord) => {
    setErrMsg(null);
    setForm({
      id: p.id,
      title: p.title,
      slug: p.slug,
      client_name: p.client_name,
      category: p.category,
      summary: p.summary,
      description: p.description,
      external_url: p.external_url,
      metricsText: (p.metrics ?? []).map((m) => `${m.label} | ${m.value}`).join('\n'),
      is_featured: p.is_featured,
      is_visible: p.is_visible,
      display_order: p.display_order,
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Portfolio Projects
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Create and manage Klido case studies, outcome metrics, and visibility across pages.
          </p>
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={() => {
              setErrMsg(null);
              setForm({ ...EMPTY_FORM, display_order: projects.length + 1 });
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Project</span>
          </button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            No portfolio case studies yet. Click <strong>New Project</strong> to add your first case study.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Title &amp; Client</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Metrics</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-500">#{p.display_order}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#111111]">{p.title}</p>
                      <p className="text-xs text-zinc-500">{p.client_name || p.slug}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">{p.category}</td>
                    <td className="px-5 py-3.5 text-xs tabular-nums text-zinc-600">
                      {(p.metrics ?? []).length} metric(s)
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">
                      {p.is_visible ? 'Visible' : 'Hidden'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {canEdit ? (
                        <div className="inline-flex items-center gap-3">
                          <button type="button" onClick={() => openEdit(p)} className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] hover:underline">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button type="button" onClick={() => deleteMutation.mutate(p.id)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="font-editorial text-lg font-semibold text-[#111111]">
                {form.id ? 'Edit Project' : 'New Portfolio Case Study'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {errMsg ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errMsg}</div> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Case Study Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title: val,
                        slug: prev.id
                          ? prev.slug
                          : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                      }));
                    }}
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Slug</label>
                  <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Client Name</label>
                  <input type="text" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Category</label>
                  <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">Summary</label>
                <textarea rows={2} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">
                  Outcome Metrics (Label | Value, one per line)
                </label>
                <textarea rows={3} value={form.metricsText} onChange={(e) => setForm({ ...form, metricsText: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Case Study URL</label>
                  <input type="url" value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Display Order</label>
                  <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="flex gap-6">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#111111]">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 accent-[#111111]" />
                  <span>Featured</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#111111]">
                  <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="h-4 w-4 accent-[#111111]" />
                  <span>Visible</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-[#FAF9F6] px-5 py-3.5">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium">Cancel</button>
              <button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} className="rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                {saveMutation.isPending ? 'Saving…' : 'Save Project'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
