import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { deleteBrand, listBrands, upsertBrand } from '../../lib/contentApi';
import { useAuth } from '../../providers/AuthProvider';
import type { BrandRecord } from '../../types/database';

interface BrandFormState {
  id?: string;
  name: string;
  slug: string;
  description: string;
  scopesText: string;
  filterKeysText: string;
  website_url: string;
  instagram_url: string;
  layout_variant: 'card' | 'wide';
  display_order: number;
  is_visible: boolean;
}

const EMPTY_FORM: BrandFormState = {
  name: '',
  slug: '',
  description: '',
  scopesText: 'Social Media, Business Ops',
  filterKeysText: 'social, ops',
  website_url: '',
  instagram_url: '',
  layout_variant: 'card',
  display_order: 0,
  is_visible: true,
};

const toCsv = (s: string) =>
  s
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export default function BrandsManagerPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<BrandFormState>(EMPTY_FORM);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['brands-manager'],
    queryFn: listBrands,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertBrand({
        id: form.id,
        name: form.name,
        slug: form.slug,
        logo_asset_id: null,
        preview_asset_id: null,
        description: form.description,
        scopes: toCsv(form.scopesText),
        filter_keys: toCsv(form.filterKeysText),
        website_url: form.website_url,
        instagram_url: form.instagram_url,
        layout_variant: form.layout_variant,
        display_order: Number(form.display_order) || 0,
        is_visible: form.is_visible,
      }),
    onSuccess: async () => {
      setErrMsg(null);
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['brands-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-brands'] });
    },
    onError: (err) => setErrMsg(err instanceof Error ? err.message : 'Unable to save brand.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBrand,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['brands-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-brands'] });
    },
  });

  const openEdit = (b: BrandRecord) => {
    setErrMsg(null);
    setForm({
      id: b.id,
      name: b.name,
      slug: b.slug,
      description: b.description,
      scopesText: (b.scopes ?? []).join(', '),
      filterKeysText: (b.filter_keys ?? []).join(', '),
      website_url: b.website_url,
      instagram_url: b.instagram_url,
      layout_variant: b.layout_variant,
      display_order: b.display_order,
      is_visible: b.is_visible,
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Brands &amp; Clients
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage Klido partner showcases (HashiBusiness, Saanjh by Riya, Zegore) and layout widths.
          </p>
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={() => {
              setErrMsg(null);
              setForm({ ...EMPTY_FORM, display_order: brands.length + 1 });
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Brand</span>
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
        ) : brands.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-zinc-500">
            No brands configured yet. Seed default Klido brands from Pages or click Add Brand.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-[#FAF9F6] text-xs font-semibold text-zinc-500">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Brand</th>
                  <th className="px-5 py-3">Scopes</th>
                  <th className="px-5 py-3">Layout</th>
                  <th className="px-5 py-3">Visibility</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/70">
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-500">#{b.display_order}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-[#111111]">{b.name}</p>
                      <p className="line-clamp-1 max-w-md text-xs text-zinc-500">{b.description}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">{(b.scopes ?? []).join(', ')}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-600">{b.layout_variant}</td>
                    <td className="px-5 py-3.5 text-xs text-zinc-600">{b.is_visible ? 'Visible' : 'Hidden'}</td>
                    <td className="px-5 py-3.5 text-right">
                      {canEdit ? (
                        <div className="inline-flex items-center gap-3">
                          <button type="button" onClick={() => openEdit(b)} className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] hover:underline">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button type="button" onClick={() => deleteMutation.mutate(b.id)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
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
                {form.id ? 'Edit Brand' : 'Add Partner Brand'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {errMsg ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errMsg}</div> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Brand Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name: val,
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Scopes (comma-separated)</label>
                  <input type="text" value={form.scopesText} onChange={(e) => setForm({ ...form, scopesText: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Layout Variant</label>
                  <select value={form.layout_variant} onChange={(e) => setForm({ ...form, layout_variant: e.target.value as 'card' | 'wide' })} className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm">
                    <option value="card">Standard Card</option>
                    <option value="wide">Wide Asymmetric Card</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Website URL</label>
                  <input type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Instagram URL</label>
                  <input type="url" value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-xs" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 items-center">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Display Order</label>
                  <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                </div>
                <label className="inline-flex items-center gap-2 pt-5 text-xs font-medium text-[#111111]">
                  <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="h-4 w-4 accent-[#111111]" />
                  <span>Visible on public site</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-[#FAF9F6] px-5 py-3.5">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium">Cancel</button>
              <button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} className="rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                {saveMutation.isPending ? 'Saving…' : 'Save Brand'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
