import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import { deleteService, listServices, upsertService } from '../../lib/contentApi';
import { seedMissingDefaultServices } from '../../lib/seedKlidoCms';
import { useAuth } from '../../providers/AuthProvider';
import type { ServiceRecord } from '../../types/database';

interface ServiceFormState {
  id?: string;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  service_kind: 'plan' | 'practice_area';
  price_display: string;
  original_price_display: string;
  discount_label: string;
  billing_period: string;
  featuresText: string;
  deliverablesText: string;
  toolingText: string;
  mappedDisciplinesText: string;
  cadence: string;
  cta_label: string;
  cta_url: string;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
}

const EMPTY_FORM: ServiceFormState = {
  title: '',
  slug: '',
  subtitle: '',
  description: '',
  service_kind: 'plan',
  price_display: '',
  original_price_display: '',
  discount_label: '',
  billing_period: '/month',
  featuresText: '',
  deliverablesText: '',
  toolingText: '',
  mappedDisciplinesText: '',
  cadence: '',
  cta_label: 'Get Started',
  cta_url: '/contact',
  is_featured: false,
  is_visible: true,
  display_order: 0,
};

const toLines = (text: string) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

export default function ServicesManagerPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [kindFilter, setKindFilter] = useState<'all' | 'plan' | 'practice_area'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-manager'],
    queryFn: listServices,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertService({
        id: form.id,
        title: form.title,
        slug: form.slug,
        subtitle: form.subtitle,
        description: form.description,
        service_kind: form.service_kind,
        price_display: form.price_display,
        original_price_display: form.original_price_display,
        discount_label: form.discount_label,
        billing_period: form.billing_period,
        image_asset_id: null,
        features: toLines(form.featuresText),
        deliverables: toLines(form.deliverablesText),
        tooling: toLines(form.toolingText),
        mapped_disciplines: toLines(form.mappedDisciplinesText),
        cadence: form.cadence,
        cta_label: form.cta_label,
        cta_url: form.cta_url,
        is_featured: form.is_featured,
        is_visible: form.is_visible,
        display_order: Number(form.display_order) || 0,
      }),
    onSuccess: async () => {
      setErrMsg(null);
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['services-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-collections-public'] });
    },
    onError: (err) => {
      setErrMsg(err instanceof Error ? err.message : 'Unable to save service.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['services-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-collections-public'] });
    },
  });

  const seedDefaultsMutation = useMutation({
    mutationFn: seedMissingDefaultServices,
    onSuccess: async () => {
      setErrMsg(null);
      await queryClient.invalidateQueries({ queryKey: ['services-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-collections-public'] });
    },
    onError: (err) => {
      setErrMsg(err instanceof Error ? err.message : 'Unable to seed default services.');
    },
  });

  const openCreate = () => {
    setErrMsg(null);
    setForm({ ...EMPTY_FORM, display_order: services.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (svc: ServiceRecord) => {
    setErrMsg(null);
    setForm({
      id: svc.id,
      title: svc.title,
      slug: svc.slug,
      subtitle: svc.subtitle,
      description: svc.description,
      service_kind: svc.service_kind,
      price_display: svc.price_display,
      original_price_display: svc.original_price_display,
      discount_label: svc.discount_label,
      billing_period: svc.billing_period,
      featuresText: (svc.features ?? []).join('\n'),
      deliverablesText: (svc.deliverables ?? []).join('\n'),
      toolingText: (svc.tooling ?? []).join('\n'),
      mappedDisciplinesText: (svc.mapped_disciplines ?? []).join('\n'),
      cadence: svc.cadence,
      cta_label: svc.cta_label,
      cta_url: svc.cta_url,
      is_featured: svc.is_featured,
      is_visible: svc.is_visible,
      display_order: svc.display_order,
    });
    setModalOpen(true);
  };

  const filtered = services.filter((s) =>
    kindFilter === 'all' ? true : s.service_kind === kindFilter
  );
  const missingPracticeAreas =
    !isLoading && services.filter((s) => s.service_kind === 'practice_area').length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Services &amp; Pricing Plans
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage Klido monthly retainers (e.g. Meta Ads, Growth Bundle) and core practice areas. Saved changes publish live to Supabase immediately.
          </p>
        </div>

        {canEdit ? (
          <div className="flex flex-wrap items-center gap-2">
            {missingPracticeAreas ? (
              <button
                type="button"
                disabled={seedDefaultsMutation.isPending}
                onClick={() => seedDefaultsMutation.mutate()}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium text-[#111111] hover:bg-zinc-50 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{seedDefaultsMutation.isPending ? 'Seeding…' : 'Seed 4 Practice Areas'}</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Service</span>
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 w-fit">
        {(
          [
            { id: 'all', label: 'All Services' },
            { id: 'plan', label: 'Pricing Plans' },
            { id: 'practice_area', label: 'Practice Areas' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setKindFilter(tab.id)}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
              kindFilter === tab.id ? 'bg-[#111111] text-white' : 'text-zinc-600 hover:text-[#111111]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            No services found. Seed default Klido services from the Pages screen or add one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Kind</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Visibility</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((svc) => (
                  <tr key={svc.id} className="hover:bg-zinc-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-zinc-500">
                      #{svc.display_order}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium text-[#111111]">
                        <span>{svc.title}</span>
                        {svc.is_featured ? (
                          <Star className="h-3.5 w-3.5 fill-[#111111] text-[#111111]" />
                        ) : null}
                      </div>
                      <p className="text-xs text-zinc-500">{svc.subtitle}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs capitalize text-zinc-600">
                      {svc.service_kind.replace('_', ' ')}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#111111]">
                      {svc.price_display ? `${svc.price_display}${svc.billing_period}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">
                      {svc.is_visible ? 'Visible' : 'Hidden'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {canEdit ? (
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEdit(svc)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] hover:underline"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(svc.id)}
                            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
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
          <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="font-editorial text-lg font-semibold text-[#111111]">
                {form.id ? 'Edit Service' : 'Create Service'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {errMsg ? (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errMsg}</div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Title</label>
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
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Kind</label>
                  <select
                    value={form.service_kind}
                    onChange={(e) =>
                      setForm({ ...form, service_kind: e.target.value as 'plan' | 'practice_area' })
                    }
                    className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="plan">Pricing Plan</option>
                    <option value="practice_area">Practice Area</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">Subtitle</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-xs"
                />
              </div>

              {form.service_kind === 'plan' ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">Price</label>
                      <input
                        type="text"
                        placeholder="₹9,999"
                        value={form.price_display}
                        onChange={(e) => setForm({ ...form, price_display: e.target.value })}
                        className="mt-1 w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">Original Price</label>
                      <input
                        type="text"
                        placeholder="₹12,999"
                        value={form.original_price_display}
                        onChange={(e) => setForm({ ...form, original_price_display: e.target.value })}
                        className="mt-1 w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">Discount</label>
                      <input
                        type="text"
                        placeholder="23% OFF"
                        value={form.discount_label}
                        onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
                        className="mt-1 w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">Period</label>
                      <input
                        type="text"
                        placeholder="/month"
                        value={form.billing_period}
                        onChange={(e) => setForm({ ...form, billing_period: e.target.value })}
                        className="mt-1 w-full rounded border border-zinc-300 px-2.5 py-1.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#111111]">
                      Features (one per line)
                    </label>
                    <textarea
                      rows={4}
                      value={form.featuresText}
                      onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
                      className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-xs"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#111111]">Operating Cadence</label>
                    <input
                      type="text"
                      placeholder="Weekly optimization & creative review"
                      value={form.cadence}
                      onChange={(e) => setForm({ ...form, cadence: e.target.value })}
                      className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">
                        Core Deliverables (one per line)
                      </label>
                      <textarea
                        rows={4}
                        value={form.deliverablesText}
                        onChange={(e) => setForm({ ...form, deliverablesText: e.target.value })}
                        className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">
                        Primary Stack &amp; Tooling (one per line)
                      </label>
                      <textarea
                        rows={4}
                        value={form.toolingText}
                        onChange={(e) => setForm({ ...form, toolingText: e.target.value })}
                        className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">CTA Label</label>
                  <input
                    type="text"
                    value={form.cta_label}
                    onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">CTA URL</label>
                  <input
                    type="text"
                    value={form.cta_url}
                    onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
                    className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#111111]">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="h-4 w-4 accent-[#111111]"
                  />
                  <span>Featured (e.g. Growth Bundle dark card)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium text-[#111111]">
                  <input
                    type="checkbox"
                    checked={form.is_visible}
                    onChange={(e) => setForm({ ...form, is_visible: e.target.checked })}
                    className="h-4 w-4 accent-[#111111]"
                  />
                  <span>Visible on public site</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-[#FAF9F6] px-5 py-3.5">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium">
                Cancel
              </button>
              <button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
