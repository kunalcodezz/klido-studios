import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  deleteNavigationItem,
  listNavigationItems,
  upsertNavigationItem,
} from '../../lib/contentApi';
import { useAuth } from '../../providers/AuthProvider';
import type { NavigationItemRecord } from '../../types/database';

type NavLocation = NavigationItemRecord['location'];

interface NavFormState {
  id?: string;
  location: NavLocation;
  label: string;
  href: string;
  is_external: boolean;
  is_cta: boolean;
  is_visible: boolean;
  display_order: number;
}

const LOCATIONS: { id: NavLocation; title: string; subtitle: string }[] = [
  { id: 'header', title: 'Header Navigation', subtitle: 'Primary top bar navigation links on klido.in' },
  { id: 'footer_practice', title: 'Footer — Practice Column', subtitle: 'Links in the first footer column' },
  { id: 'footer_engage', title: 'Footer — Engage Column', subtitle: 'Plans, FAQ, and Start a project CTA' },
  { id: 'footer_legal', title: 'Footer — Legal Links', subtitle: 'Privacy, terms, or disclosure links' },
];

export default function NavigationManagerPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NavFormState>({
    location: 'header',
    label: '',
    href: '/',
    is_external: false,
    is_cta: false,
    is_visible: true,
    display_order: 1,
  });
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['navigation-manager'],
    queryFn: listNavigationItems,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertNavigationItem({
        ...form,
        parent_id: null,
        display_order: Number(form.display_order) || 0,
      }),
    onSuccess: async () => {
      setErrMsg(null);
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['navigation-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-global-settings'] });
    },
    onError: (err) => setErrMsg(err instanceof Error ? err.message : 'Unable to save link.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNavigationItem,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['navigation-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-global-settings'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Navigation &amp; Footer Links
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Control header navigation items, footer columns, and primary CTA links.
          </p>
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={() => {
              setErrMsg(null);
              setForm({
                location: 'header',
                label: '',
                href: '/',
                is_external: false,
                is_cta: false,
                is_visible: true,
                display_order: items.length + 1,
              });
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Navigation Link</span>
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-zinc-200/70" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {LOCATIONS.map((loc) => {
            const locItems = items.filter((i) => i.location === loc.id);
            return (
              <section key={loc.id} className="rounded-lg border border-zinc-200 bg-white p-5">
                <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[#111111]">{loc.title}</h2>
                    <p className="text-xs text-zinc-500">{loc.subtitle}</p>
                  </div>
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => {
                        setErrMsg(null);
                        setForm({
                          location: loc.id,
                          label: '',
                          href: '/',
                          is_external: false,
                          is_cta: false,
                          is_visible: true,
                          display_order: locItems.length + 1,
                        });
                        setModalOpen(true);
                      }}
                      className="text-xs font-semibold text-[#111111] hover:underline"
                    >
                      + Add
                    </button>
                  ) : null}
                </div>

                {locItems.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-500">No items in this slot.</p>
                ) : (
                  <div className="mt-3 divide-y divide-zinc-100">
                    {locItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2.5 text-xs">
                        <div className="min-w-0 pr-3">
                          <p className="font-medium text-[#111111]">
                            {item.label}
                            {item.is_cta ? ' (CTA)' : ''}
                            {!item.is_visible ? ' · Hidden' : ''}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-500">{item.href}</p>
                        </div>
                        {canEdit ? (
                          <div className="flex shrink-0 items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setErrMsg(null);
                                setForm({
                                  id: item.id,
                                  location: item.location,
                                  label: item.label,
                                  href: item.href,
                                  is_external: item.is_external,
                                  is_cta: item.is_cta,
                                  is_visible: item.is_visible,
                                  display_order: item.display_order,
                                });
                                setModalOpen(true);
                              }}
                              className="text-zinc-600 hover:text-[#111111]"
                              aria-label={`Edit ${item.label}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(item.id)}
                              className="text-red-600 hover:text-red-700"
                              aria-label={`Delete ${item.label}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="font-editorial text-lg font-semibold text-[#111111]">
                {form.id ? 'Edit Navigation Link' : 'Add Navigation Link'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              {errMsg ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errMsg}</div> : null}

              <div>
                <label className="block text-xs font-semibold text-[#111111]">Slot Location</label>
                <select
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value as NavLocation })}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  {LOCATIONS.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Label</label>
                <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Target URL / Path</label>
                  <input type="text" value={form.href} onChange={(e) => setForm({ ...form, href: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Order</label>
                  <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center gap-2 text-xs font-medium">
                  <input type="checkbox" checked={form.is_visible} onChange={(e) => setForm({ ...form, is_visible: e.target.checked })} className="h-4 w-4 accent-[#111111]" />
                  Visible
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium">
                  <input type="checkbox" checked={form.is_cta} onChange={(e) => setForm({ ...form, is_cta: e.target.checked })} className="h-4 w-4 accent-[#111111]" />
                  Highlight as CTA
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium">
                  <input type="checkbox" checked={form.is_external} onChange={(e) => setForm({ ...form, is_external: e.target.checked })} className="h-4 w-4 accent-[#111111]" />
                  Open externally
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-zinc-200 bg-[#FAF9F6] px-5 py-3.5">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-zinc-300 bg-white px-3.5 py-2 text-xs font-medium">Cancel</button>
              <button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} className="rounded-md bg-[#111111] px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
                {saveMutation.isPending ? 'Saving…' : 'Save Link'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
