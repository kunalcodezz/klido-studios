import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  deleteTestimonial,
  listTestimonials,
  upsertTestimonial,
} from '../../lib/contentApi';
import { useAuth } from '../../providers/AuthProvider';
import type { TestimonialRecord } from '../../types/database';

interface TestimonialFormState {
  id?: string;
  author_name: string;
  author_designation: string;
  company_name: string;
  quote: string;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
}

const EMPTY_FORM: TestimonialFormState = {
  author_name: '',
  author_designation: '',
  company_name: '',
  quote: '',
  is_featured: false,
  is_visible: true,
  display_order: 0,
};

export default function TestimonialsManagerPage() {
  const { canEdit } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TestimonialFormState>(EMPTY_FORM);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['testimonials-manager'],
    queryFn: listTestimonials,
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      upsertTestimonial({
        id: form.id,
        author_name: form.author_name,
        author_designation: form.author_designation,
        company_name: form.company_name,
        quote: form.quote,
        avatar_asset_id: null,
        project_id: null,
        service_id: null,
        is_featured: form.is_featured,
        is_visible: form.is_visible,
        display_order: Number(form.display_order) || 0,
      }),
    onSuccess: async () => {
      setErrMsg(null);
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['testimonials-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-collections-public'] });
    },
    onError: (err) => setErrMsg(err instanceof Error ? err.message : 'Unable to save testimonial.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['testimonials-manager'] });
      await queryClient.invalidateQueries({ queryKey: ['cms-collections-public'] });
    },
  });

  const openEdit = (t: TestimonialRecord) => {
    setErrMsg(null);
    setForm({
      id: t.id,
      author_name: t.author_name,
      author_designation: t.author_designation,
      company_name: t.company_name,
      quote: t.quote,
      is_featured: t.is_featured,
      is_visible: t.is_visible,
      display_order: t.display_order,
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Testimonials
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Curate verified founder quotes displayed inside Klido Testimonials Grid sections.
          </p>
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={() => {
              setErrMsg(null);
              setForm({ ...EMPTY_FORM, display_order: testimonials.length + 1 });
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#111111] px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Testimonial</span>
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-zinc-200/70" />
          ))
        ) : testimonials.length === 0 ? (
          <div className="col-span-full rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            No client testimonials added yet.
          </div>
        ) : (
          testimonials.map((t) => (
            <div key={t.id} className="flex flex-col justify-between rounded-lg border border-zinc-200 bg-white p-5">
              <div>
                <p className="text-sm leading-relaxed text-[#111111]">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3">
                <div>
                  <p className="text-xs font-semibold text-[#111111]">{t.author_name}</p>
                  <p className="text-[11px] text-zinc-500">
                    {[t.author_designation, t.company_name].filter(Boolean).join(' · ')}
                  </p>
                </div>
                {canEdit ? (
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => openEdit(t)} className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] hover:underline">
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteMutation.mutate(t.id)} className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline">
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-lg border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="font-editorial text-lg font-semibold text-[#111111]">
                {form.id ? 'Edit Testimonial' : 'Add Testimonial'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              {errMsg ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errMsg}</div> : null}
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Author Name</label>
                <input type="text" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Role / Designation</label>
                  <input type="text" value={form.author_designation} onChange={(e) => setForm({ ...form, author_designation: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111111]">Company</label>
                  <input type="text" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111111]">Quote</label>
                <textarea rows={4} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
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
                {saveMutation.isPending ? 'Saving…' : 'Save Testimonial'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
