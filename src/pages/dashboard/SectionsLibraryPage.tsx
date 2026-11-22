import { useMemo, useState } from 'react';
import { Monitor, Search, Smartphone, Tablet } from 'lucide-react';
import {
  createBlockNode,
  getAllBlockDefinitions,
  type BlockCategory,
} from '../../blocks/registry';
import { PageRenderer } from '../../blocks/PageRenderer';
import type { ViewportMode } from '../../schemas/styles';
import { KLIDO_SEED_PAGES } from '../../data/klidoSeedPages';

const CATEGORIES: ('All' | BlockCategory)[] = [
  'All',
  'Hero',
  'About',
  'Services',
  'Portfolio',
  'Brands',
  'Testimonials',
  'Statistics',
  'CTA',
  'Contact',
  'FAQ',
  'Footer',
  'Layout',
];

export default function SectionsLibraryPage() {
  const allBlocks = useMemo(() => getAllBlockDefinitions(), []);
  const [category, setCategory] = useState<'All' | BlockCategory>('All');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>(allBlocks[0]?.type ?? 'hero');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [previewMode, setPreviewMode] = useState<'block' | 'page'>('block');
  const [selectedSeedSlug, setSelectedSeedSlug] = useState<string>('/');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allBlocks.filter((block) => {
      const matchesCat = category === 'All' || block.category === category;
      const matchesSearch =
        !q ||
        block.displayName.toLowerCase().includes(q) ||
        block.description.toLowerCase().includes(q) ||
        block.type.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [allBlocks, category, search]);

  const activeDef = allBlocks.find((b) => b.type === selectedType) ?? allBlocks[0];
  const activeSeedPage =
    KLIDO_SEED_PAGES.find((p) => p.slug === selectedSeedSlug) ?? KLIDO_SEED_PAGES[0];

  const previewContent = useMemo(() => {
    if (previewMode === 'page') {
      return activeSeedPage.tree;
    }
    return {
      version: 1 as const,
      sections: activeDef ? [createBlockNode(activeDef.type)] : [],
    };
  }, [previewMode, activeSeedPage, activeDef]);

  const previewWidthClass =
    viewport === 'mobile'
      ? 'max-w-[390px]'
      : viewport === 'tablet'
        ? 'max-w-[768px]'
        : 'max-w-full';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="font-editorial text-2xl font-semibold tracking-tight text-[#111111]">
            Sections Library &amp; Block Registry
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Browse all {allBlocks.length} registered Klido CMS blocks and preview the 5 seeded website pages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border border-zinc-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setPreviewMode('block')}
              className={`rounded px-3 py-1 text-xs font-medium ${
                previewMode === 'block' ? 'bg-[#111111] text-white' : 'text-zinc-600'
              }`}
            >
              Single Block
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('page')}
              className={`rounded px-3 py-1 text-xs font-medium ${
                previewMode === 'page' ? 'bg-[#111111] text-white' : 'text-zinc-600'
              }`}
            >
              Full Klido Page
            </button>
          </div>

          <div className="flex items-center rounded-md border border-zinc-200 bg-white p-1">
            {(
              [
                { id: 'desktop', icon: Monitor, label: 'Desktop' },
                { id: 'tablet', icon: Tablet, label: 'Tablet' },
                { id: 'mobile', icon: Smartphone, label: 'Mobile' },
              ] as const
            ).map((vp) => {
              const Icon = vp.icon;
              return (
                <button
                  key={vp.id}
                  type="button"
                  title={vp.label}
                  aria-label={`${vp.label} preview`}
                  onClick={() => setViewport(vp.id)}
                  className={`rounded p-1.5 ${
                    viewport === vp.id ? 'bg-[#111111] text-white' : 'text-zinc-600'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {previewMode === 'page' ? (
        <div className="flex flex-wrap items-center gap-2">
          {KLIDO_SEED_PAGES.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setSelectedSeedSlug(p.slug)}
              className={`rounded-md border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                selectedSeedSlug === p.slug
                  ? 'border-[#111111] bg-[#111111] text-white'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {p.title} ({p.slug})
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left: Filter + Registry list */}
          <div className="space-y-4 lg:col-span-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search blocks…"
                className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    category === cat
                      ? 'bg-[#111111] text-white'
                      : 'border border-zinc-200 bg-white text-zinc-600 hover:text-[#111111]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="max-h-[540px] divide-y divide-zinc-100 overflow-y-auto rounded-lg border border-zinc-200 bg-white">
              {filtered.map((block) => (
                <button
                  key={block.type}
                  type="button"
                  onClick={() => setSelectedType(block.type)}
                  className={`w-full px-4 py-3 text-left transition-colors ${
                    block.type === activeDef?.type ? 'bg-[#F4F3EF]' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#111111]">
                      {block.displayName}
                    </span>
                    <span className="text-[11px] text-zinc-500">{block.category}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                    {block.description}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-400">
                    {block.type}
                    {block.supportsChildren ? ' · supports children' : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Live Block Preview */}
          <div className="lg:col-span-8">
            <div className="rounded-lg border border-zinc-200 bg-white">
              <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#111111]">
                    {activeDef?.displayName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Type: <code>{activeDef?.type}</code> · {activeDef?.editableFields.length ?? 0}{' '}
                    inspector fields
                  </p>
                </div>
                <span className="text-xs capitalize text-zinc-500">{viewport} preview</span>
              </div>
              <div className="overflow-x-auto bg-[#F4F3EF] p-4">
                <div
                  className={`mx-auto overflow-hidden rounded-md border border-zinc-200 bg-white transition-all ${previewWidthClass}`}
                >
                  <PageRenderer content={previewContent} viewport={viewport} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewMode === 'page' ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-[#F4F3EF] p-4">
          <div
            className={`mx-auto overflow-hidden rounded-md border border-zinc-200 bg-white transition-all ${previewWidthClass}`}
          >
            <PageRenderer content={previewContent} viewport={viewport} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
