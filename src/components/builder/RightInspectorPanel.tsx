import { useState } from 'react';
import {
  Bookmark,
  Image as ImageIcon,
  Layers,
  Lock,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { getBlockDefinition } from '../../blocks/registry';
import { resolveBlockStylesForViewport } from '../../blocks/styleCompiler';
import type { BlockNode } from '../../schemas/blocks';
import type { BlockStyles } from '../../schemas/styles';
import type { TiptapDoc } from '../../schemas/tiptap';
import { isSafeUrl } from '../../schemas/validation';
import { findBlockById, useEditorStore } from '../../stores/editorStore';
import { MediaPickerModal } from './MediaPickerModal';
import { TiptapFieldEditor } from './TiptapFieldEditor';

interface RightInspectorPanelProps {
  canEdit: boolean;
  onSaveSectionTemplate: (block: BlockNode) => void;
}

const FONT_OPTIONS = ['inherit', 'display', 'body', 'mono', 'editorial'] as const;
const SHADOW_OPTIONS = ['none', 'subtle', 'elevated', 'card'] as const;

export function RightInspectorPanel({
  canEdit,
  onSaveSectionTemplate,
}: RightInspectorPanelProps) {
  const {
    content,
    selectedBlockId,
    viewport,
    renameBlock,
    updateBlockProp,
    updateBlockStyles,
    clearViewportStyleOverrides,
    updateBlockAnimations,
    addBlock,
  } = useEditorStore();

  const [tab, setTab] = useState<'content' | 'style' | 'layout' | 'motion'>('content');
  const [mediaTarget, setMediaTarget] = useState<{
    key: string;
    filter: 'image' | 'video';
  } | null>(null);
  const [urlWarning, setUrlWarning] = useState<string | null>(null);

  const node = findBlockById(content.sections, selectedBlockId);

  if (!node) {
    return (
      <aside className="flex h-full w-80 shrink-0 flex-col items-center justify-center border-l border-zinc-200 bg-white px-6 text-center">
        <Layers className="h-7 w-7 text-zinc-300" aria-hidden="true" />
        <p className="mt-3 text-sm font-medium text-[#111111]">No Section Selected</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Click any section on the canvas or in the Layers tree to inspect content, typography,
          responsive spacing, and animations.
        </p>
      </aside>
    );
  }

  const def = getBlockDefinition(node.type);
  const isDisabled = !canEdit || node.locked;
  const resolvedStyles = resolveBlockStylesForViewport(node.styles, node.responsive, viewport);
  const hasViewportOverride =
    viewport !== 'desktop' &&
    Boolean(
      node.responsive?.[viewport] &&
        Object.keys(node.responsive[viewport] ?? {}).length > 0
    );

  const safeUpdateUrlProp = (key: string, nextUrl: string) => {
    const trimmed = nextUrl.trim();
    if (trimmed && !isSafeUrl(trimmed)) {
      setUrlWarning(`"${trimmed}" is not a safe URL. Use https://, http://, /, #, mailto:, or tel:.`);
      return;
    }
    setUrlWarning(null);
    updateBlockProp(node.id, key, trimmed);
  };

  const renderCtaEditor = (
    propKey: 'primaryCta' | 'secondaryCta',
    title: string
  ) => {
    const cta = node.props[propKey] as
      | { label?: string; href?: string; variant?: 'primary' | 'secondary' | 'ghost' }
      | undefined;
    if (!cta) return null;

    return (
      <div className="space-y-2 rounded-md border border-zinc-200 bg-[#FAF9F6] p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </p>
        <input
          type="text"
          disabled={isDisabled}
          value={cta.label ?? ''}
          onChange={(e) =>
            updateBlockProp(node.id, propKey, { ...cta, label: e.target.value })
          }
          placeholder="Button label"
          className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs focus:border-[#111111] focus:outline-none"
        />
        <input
          type="text"
          disabled={isDisabled}
          value={cta.href ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            if (val && !isSafeUrl(val)) {
              setUrlWarning('CTA URL must use https://, /, #, mailto:, or tel:.');
              return;
            }
            setUrlWarning(null);
            updateBlockProp(node.id, propKey, { ...cta, href: val });
          }}
          placeholder="/contact or #start-project"
          className="w-full rounded border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs focus:border-[#111111] focus:outline-none"
        />
      </div>
    );
  };

  const styleValue = <K extends keyof BlockStyles>(key: K): string => {
    const v = resolvedStyles[key];
    return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
  };

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-zinc-200 bg-white">
      {/* Selected Block Header */}
      <div className="border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            disabled={isDisabled}
            value={node.name}
            onChange={(e) => renameBlock(node.id, e.target.value)}
            aria-label="Block layer name"
            className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-[#111111] hover:border-zinc-200 focus:border-[#111111] focus:bg-white focus:outline-none"
          />
          {canEdit ? (
            <button
              type="button"
              title="Save as reusable section"
              onClick={() => onSaveSectionTemplate(node)}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-[#111111]"
            >
              <Bookmark className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <div className="mt-1 flex items-center justify-between px-1 text-[11px] text-zinc-500">
          <span>{def?.displayName ?? node.type}</span>
          {node.locked ? (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
              <Lock className="h-3 w-3" />
              Locked
            </span>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 border-b border-zinc-200 bg-[#FAF9F6] p-1">
        {(['content', 'style', 'layout', 'motion'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded px-2 py-1.5 text-xs font-medium capitalize transition-colors ${
              tab === t
                ? 'bg-white text-[#111111] shadow-xs'
                : 'text-zinc-600 hover:text-[#111111]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Inspector Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {urlWarning ? (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {urlWarning}
          </div>
        ) : null}

        {/* CONTENT TAB */}
        {tab === 'content' ? (
          <div className="space-y-4">
            {def?.editableFields.map((field) => {
              const rawVal = node.props[field.key];

              if (field.control === 'text') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-[#111111]">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      disabled={isDisabled}
                      value={typeof rawVal === 'string' ? rawVal : ''}
                      onChange={(e) => updateBlockProp(node.id, field.key, e.target.value)}
                      className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none disabled:opacity-60"
                    />
                  </div>
                );
              }

              if (field.control === 'textarea') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-[#111111]">
                      {field.label}
                    </label>
                    <textarea
                      rows={3}
                      disabled={isDisabled}
                      value={typeof rawVal === 'string' ? rawVal : ''}
                      onChange={(e) => updateBlockProp(node.id, field.key, e.target.value)}
                      className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none disabled:opacity-60"
                    />
                  </div>
                );
              }

              if (field.control === 'select') {
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-[#111111]">
                      {field.label}
                    </label>
                    <select
                      disabled={isDisabled}
                      value={typeof rawVal === 'string' ? rawVal : (field.options?.[0] ?? '')}
                      onChange={(e) => updateBlockProp(node.id, field.key, e.target.value)}
                      className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-xs text-[#111111] focus:border-[#111111] focus:outline-none disabled:opacity-60"
                    >
                      {(field.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (field.control === 'boolean') {
                return (
                  <label
                    key={field.key}
                    className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2 text-xs font-medium text-[#111111]"
                  >
                    <span>{field.label}</span>
                    <input
                      type="checkbox"
                      disabled={isDisabled}
                      checked={Boolean(rawVal)}
                      onChange={(e) => updateBlockProp(node.id, field.key, e.target.checked)}
                      className="h-4 w-4 accent-[#111111]"
                    />
                  </label>
                );
              }

              if (field.control === 'tiptap') {
                return (
                  <div key={field.key}>
                    <label className="mb-1.5 block text-xs font-semibold text-[#111111]">
                      {field.label}
                    </label>
                    <TiptapFieldEditor
                      value={rawVal as TiptapDoc | undefined}
                      disabled={isDisabled}
                      onChange={(doc) => updateBlockProp(node.id, field.key, doc)}
                    />
                  </div>
                );
              }

              if (field.control === 'image' || field.control === 'video') {
                return (
                  <div key={field.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#111111]">
                        {field.label}
                      </label>
                      {!isDisabled ? (
                        <button
                          type="button"
                          onClick={() =>
                            setMediaTarget({
                              key: field.key,
                              filter: field.control === 'video' ? 'video' : 'image',
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#111111] hover:underline"
                        >
                          <ImageIcon className="h-3 w-3" />
                          Library
                        </button>
                      ) : null}
                    </div>
                    <input
                      type="url"
                      disabled={isDisabled}
                      value={typeof rawVal === 'string' ? rawVal : ''}
                      onChange={(e) => safeUpdateUrlProp(field.key, e.target.value)}
                      placeholder="https://... or /assets/..."
                      className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 font-mono text-xs text-[#111111] focus:border-[#111111] focus:outline-none disabled:opacity-60"
                    />
                  </div>
                );
              }

              if (field.control === 'list') {
                const items = Array.isArray(rawVal) ? (rawVal as string[]) : [];
                return (
                  <div key={field.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#111111]">
                        {field.label}
                      </label>
                      {!isDisabled ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateBlockProp(node.id, field.key, [...items, 'New checklist item'])
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#111111] hover:underline"
                        >
                          <Plus className="h-3 w-3" />
                          Add
                        </button>
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            disabled={isDisabled}
                            value={item}
                            onChange={(e) => {
                              const next = [...items];
                              next[idx] = e.target.value;
                              updateBlockProp(node.id, field.key, next);
                            }}
                            className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs focus:border-[#111111] focus:outline-none"
                          />
                          {!isDisabled ? (
                            <button
                              type="button"
                              onClick={() => {
                                const next = items.filter((_, i) => i !== idx);
                                updateBlockProp(node.id, field.key, next);
                              }}
                              aria-label="Remove item"
                              className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {renderCtaEditor('primaryCta', 'Primary Button')}
            {renderCtaEditor('secondaryCta', 'Secondary Button')}

            {def?.supportsChildren && !isDisabled ? (
              <div className="space-y-2 rounded-md border border-zinc-200 bg-[#FAF9F6] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Nest Child Blocks
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['text', 'image', 'cta', 'columns'] as const).map((childType) => (
                    <button
                      key={childType}
                      type="button"
                      onClick={() => addBlock(childType, node.id)}
                      className="rounded border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium capitalize text-[#111111] hover:bg-zinc-50"
                    >
                      + {childType}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* STYLE TAB */}
        {tab === 'style' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-[#FAF9F6] px-3 py-2 text-xs">
              <div>
                <p className="font-semibold capitalize text-[#111111]">
                  {viewport} Styles
                </p>
                <p className="text-[11px] text-zinc-500">
                  {viewport === 'desktop'
                    ? 'Base styles inherited by tablet & mobile'
                    : hasViewportOverride
                      ? 'Active responsive override'
                      : 'Inheriting from desktop'}
                </p>
              </div>
              {hasViewportOverride && !isDisabled ? (
                <button
                  type="button"
                  onClick={() =>
                    clearViewportStyleOverrides(
                      node.id,
                      viewport as 'tablet' | 'mobile'
                    )
                  }
                  title="Reset overrides for this breakpoint"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 hover:text-[#111111]"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Font Family
                </label>
                <select
                  disabled={isDisabled}
                  value={styleValue('fontFamily') || 'inherit'}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, {
                      fontFamily: e.target.value as BlockStyles['fontFamily'],
                    })
                  }
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs"
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Text Align
                </label>
                <select
                  disabled={isDisabled}
                  value={styleValue('textAlign') || ''}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, {
                      textAlign: (e.target.value || undefined) as BlockStyles['textAlign'],
                    })
                  }
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs"
                >
                  <option value="">Default</option>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Text Color
                </label>
                <input
                  type="text"
                  disabled={isDisabled}
                  value={styleValue('textColor')}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, { textColor: e.target.value })
                  }
                  placeholder="#0D1126"
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Background
                </label>
                <input
                  type="text"
                  disabled={isDisabled}
                  value={styleValue('backgroundColor')}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, {
                      backgroundColor: e.target.value,
                    })
                  }
                  placeholder="#FFFFFF"
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Border Radius
                </label>
                <input
                  type="text"
                  disabled={isDisabled}
                  value={styleValue('borderRadius')}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, {
                      borderRadius: e.target.value,
                    })
                  }
                  placeholder="12px"
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Shadow
                </label>
                <select
                  disabled={isDisabled}
                  value={styleValue('boxShadow') || 'none'}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, {
                      boxShadow: e.target.value as BlockStyles['boxShadow'],
                    })
                  }
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs"
                >
                  {SHADOW_OPTIONS.map((sh) => (
                    <option key={sh} value={sh}>
                      {sh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Border Width
                </label>
                <input
                  type="text"
                  disabled={isDisabled}
                  value={styleValue('borderWidth')}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, {
                      borderWidth: e.target.value,
                    })
                  }
                  placeholder="1px"
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Border Color
                </label>
                <input
                  type="text"
                  disabled={isDisabled}
                  value={styleValue('borderColor')}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, {
                      borderColor: e.target.value,
                    })
                  }
                  placeholder="#E5E9F2"
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* LAYOUT TAB */}
        {tab === 'layout' ? (
          <div className="space-y-4">
            <p className="text-[11px] text-zinc-500">
              Editing spacing &amp; layout for <strong className="capitalize">{viewport}</strong>.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: 'paddingTop', label: 'Padding Top' },
                  { key: 'paddingBottom', label: 'Padding Bottom' },
                  { key: 'paddingLeft', label: 'Padding Left' },
                  { key: 'paddingRight', label: 'Padding Right' },
                  { key: 'marginTop', label: 'Margin Top' },
                  { key: 'marginBottom', label: 'Margin Bottom' },
                ] as const
              ).map((item) => (
                <div key={item.key}>
                  <label className="block text-[11px] font-semibold text-zinc-700">
                    {item.label}
                  </label>
                  <input
                    type="text"
                    disabled={isDisabled}
                    value={styleValue(item.key)}
                    onChange={(e) =>
                      updateBlockStyles(node.id, viewport, {
                        [item.key]: e.target.value,
                      })
                    }
                    placeholder="0px"
                    className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Max Width
                </label>
                <input
                  type="text"
                  disabled={isDisabled}
                  value={styleValue('maxWidth')}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, { maxWidth: e.target.value })
                  }
                  placeholder="1200px"
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-700">
                  Min Height
                </label>
                <input
                  type="text"
                  disabled={isDisabled}
                  value={styleValue('minHeight')}
                  onChange={(e) =>
                    updateBlockStyles(node.id, viewport, { minHeight: e.target.value })
                  }
                  placeholder="auto"
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* MOTION TAB */}
        {tab === 'motion' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#111111]">
                Entrance Preset
              </label>
              <select
                disabled={isDisabled}
                value={node.animations?.preset ?? 'none'}
                onChange={(e) =>
                  updateBlockAnimations(node.id, {
                    preset: e.target.value as BlockNode['animations']['preset'],
                  })
                }
                className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-xs"
              >
                <option value="none">None</option>
                <option value="fade-in">Fade In</option>
                <option value="slide-up">Slide Up</option>
                <option value="scale-in">Scale In</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#111111]">
                  Duration (ms)
                </label>
                <input
                  type="number"
                  min={50}
                  max={1500}
                  step={50}
                  disabled={isDisabled}
                  value={node.animations?.durationMs ?? 250}
                  onChange={(e) =>
                    updateBlockAnimations(node.id, {
                      durationMs: Math.min(1500, Math.max(50, Number(e.target.value) || 250)),
                    })
                  }
                  className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">
                  Delay (ms)
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  step={50}
                  disabled={isDisabled}
                  value={node.animations?.delayMs ?? 0}
                  onChange={(e) =>
                    updateBlockAnimations(node.id, {
                      delayMs: Math.min(1000, Math.max(0, Number(e.target.value) || 0)),
                    })
                  }
                  className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111111]">
                Trigger
              </label>
              <select
                disabled={isDisabled}
                value={node.animations?.trigger ?? 'on-scroll'}
                onChange={(e) =>
                  updateBlockAnimations(node.id, {
                    trigger: e.target.value as 'on-load' | 'on-scroll',
                  })
                }
                className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-xs"
              >
                <option value="on-scroll">On Scroll</option>
                <option value="on-load">On Page Load</option>
              </select>
            </div>

            <label className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-2.5 text-xs font-medium text-[#111111]">
              <span>Disable animation on mobile</span>
              <input
                type="checkbox"
                disabled={isDisabled}
                checked={node.animations?.disableOnMobile ?? true}
                onChange={(e) =>
                  updateBlockAnimations(node.id, { disableOnMobile: e.target.checked })
                }
                className="h-4 w-4 accent-[#111111]"
              />
            </label>
          </div>
        ) : null}
      </div>

      <MediaPickerModal
        open={Boolean(mediaTarget)}
        filterType={mediaTarget?.filter ?? 'all'}
        onClose={() => setMediaTarget(null)}
        onSelect={(publicUrl, altText) => {
          if (!mediaTarget) return;
          updateBlockProp(node.id, mediaTarget.key, publicUrl);
          if (altText && typeof node.props.alt === 'string' && !node.props.alt) {
            updateBlockProp(node.id, 'alt', altText);
          }
          if (altText && typeof node.props.imageAlt === 'string' && !node.props.imageAlt) {
            updateBlockProp(node.id, 'imageAlt', altText);
          }
        }}
      />
    </aside>
  );
}
