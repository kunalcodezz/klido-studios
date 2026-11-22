import { useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Bookmark,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Lock,
  Plus,
  Search,
  Trash2,
  Unlock,
} from 'lucide-react';
import { getAllBlockDefinitions, getBlockDefinition } from '../../blocks/registry';
import { findBlockById, useEditorStore } from '../../stores/editorStore';
import type { BlockNode } from '../../schemas/blocks';
import type { SavedSectionTemplate } from '../../lib/builderApi';

interface LeftLayersPanelProps {
  canEdit: boolean;
  savedSections: SavedSectionTemplate[];
  onSaveSelectedAsTemplate: (block: BlockNode) => void;
  onDeleteSavedTemplate: (id: string) => void;
}

interface SortableLayerRowProps {
  node: BlockNode;
  depth: number;
  parentId: string | null;
  canEdit: boolean;
  selectedBlockId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

function SortableLayerRow({
  node,
  depth,
  parentId,
  canEdit,
  selectedBlockId,
  onSelect,
  onAddChild,
}: SortableLayerRowProps) {
  const {
    duplicateBlock,
    deleteBlock,
    toggleVisibility,
    toggleLock,
    reorderChildBlocks,
    moveBlockToContainer,
  } = useEditorStore();

  const def = getBlockDefinition(node.type);
  const supportsChildren = Boolean(def?.supportsChildren);
  const isSelected = selectedBlockId === node.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    disabled: !canEdit || node.locked,
    data: { parentId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const childSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleChildDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderChildBlocks(node.id, String(active.id), String(over.id));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50' : ''}
    >
      <div
        onClick={() => onSelect(node.id)}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        className={`group flex items-center justify-between gap-1.5 rounded-md border px-2 py-1.5 text-xs transition-colors ${
          isSelected
            ? 'border-[#111111] bg-[#F4F3EF] text-[#111111]'
            : 'border-transparent hover:bg-zinc-50 text-zinc-700'
        }`}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <button
            type="button"
            disabled={!canEdit || node.locked}
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Reorder ${node.name}`}
            className="cursor-grab rounded p-0.5 text-zinc-400 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-tight text-[#111111]">
              {node.name}
            </p>
            <p className="truncate font-mono text-[10px] text-zinc-400">
              {node.type}
              {!node.visible ? ' · hidden' : ''}
            </p>
          </div>
        </div>

        {canEdit ? (
          <div className="flex shrink-0 items-center gap-0.5 opacity-80 group-hover:opacity-100">
            {supportsChildren ? (
              <button
                type="button"
                title="Add child block"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(node.id);
                }}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200/70 hover:text-[#111111]"
              >
                <Plus className="h-3 w-3" />
              </button>
            ) : null}

            {parentId ? (
              <button
                type="button"
                title="Move to top level"
                onClick={(e) => {
                  e.stopPropagation();
                  moveBlockToContainer(node.id, null);
                }}
                className="rounded px-1 py-0.5 text-[10px] font-medium text-zinc-500 hover:bg-zinc-200/70 hover:text-[#111111]"
              >
                Out
              </button>
            ) : null}

            <button
              type="button"
              title={node.visible ? 'Hide section' : 'Show section'}
              onClick={(e) => {
                e.stopPropagation();
                toggleVisibility(node.id);
              }}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-200/70 hover:text-[#111111]"
            >
              {node.visible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3 text-amber-600" />
              )}
            </button>

            <button
              type="button"
              title={node.locked ? 'Unlock block' : 'Lock block'}
              onClick={(e) => {
                e.stopPropagation();
                toggleLock(node.id);
              }}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-200/70 hover:text-[#111111]"
            >
              {node.locked ? (
                <Lock className="h-3 w-3 text-amber-600" />
              ) : (
                <Unlock className="h-3 w-3" />
              )}
            </button>

            <button
              type="button"
              title="Duplicate"
              onClick={(e) => {
                e.stopPropagation();
                duplicateBlock(node.id);
              }}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-200/70 hover:text-[#111111]"
            >
              <Copy className="h-3 w-3" />
            </button>

            <button
              type="button"
              title={node.locked ? 'Unlock to delete' : 'Delete'}
              disabled={node.locked}
              onClick={(e) => {
                e.stopPropagation();
                deleteBlock(node.id);
              }}
              className="rounded p-1 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Nested children inside Layout containers */}
      {supportsChildren && node.children && node.children.length > 0 ? (
        <div className="mt-0.5 space-y-0.5 border-l border-zinc-200 pl-1.5 ml-3">
          <DndContext
            sensors={childSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleChildDragEnd}
          >
            <SortableContext
              items={node.children.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {node.children.map((child) => (
                <SortableLayerRow
                  key={child.id}
                  node={child}
                  depth={depth + 1}
                  parentId={node.id}
                  canEdit={canEdit}
                  selectedBlockId={selectedBlockId}
                  onSelect={onSelect}
                  onAddChild={onAddChild}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      ) : null}
    </div>
  );
}

export function LeftLayersPanel({
  canEdit,
  savedSections,
  onSaveSelectedAsTemplate,
  onDeleteSavedTemplate,
}: LeftLayersPanelProps) {
  const {
    content,
    selectedBlockId,
    selectBlock,
    addBlock,
    insertBlockNode,
    reorderSections,
  } = useEditorStore();

  const [activeTab, setActiveTab] = useState<'layers' | 'add' | 'saved'>('layers');
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const allDefs = useMemo(() => getAllBlockDefinitions(), []);
  const filteredDefs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allDefs;
    return allDefs.filter(
      (b) =>
        b.displayName.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q)
    );
  }, [allDefs, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderSections(String(active.id), String(over.id));
  };

  const selectedNode = findBlockById(content.sections, selectedBlockId);
  const targetParentNode = targetParentId
    ? findBlockById(content.sections, targetParentId)
    : null;

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-zinc-200 bg-white">
      {/* Tabs */}
      <div className="grid grid-cols-3 border-b border-zinc-200 bg-[#FAF9F6] p-1">
        <button
          type="button"
          onClick={() => {
            setTargetParentId(null);
            setActiveTab('layers');
          }}
          className={`flex items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'layers'
              ? 'bg-white text-[#111111] shadow-xs'
              : 'text-zinc-600 hover:text-[#111111]'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Layers</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('add')}
          className={`flex items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'add'
              ? 'bg-white text-[#111111] shadow-xs'
              : 'text-zinc-600 hover:text-[#111111]'
          }`}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('saved')}
          className={`flex items-center justify-center gap-1 rounded px-2 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'saved'
              ? 'bg-white text-[#111111] shadow-xs'
              : 'text-zinc-600 hover:text-[#111111]'
          }`}
        >
          <Bookmark className="h-3.5 w-3.5" />
          <span>Saved</span>
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'layers' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Page Sections ({content.sections.length})
              </span>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => {
                    setTargetParentId(null);
                    setActiveTab('add');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#111111] hover:underline"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              ) : null}
            </div>

            {content.sections.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-300 px-3 py-8 text-center text-xs text-zinc-500">
                No sections yet. Switch to <strong>Add</strong> to insert Klido blocks.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={content.sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {content.sections.map((section) => (
                      <SortableLayerRow
                        key={section.id}
                        node={section}
                        depth={0}
                        parentId={null}
                        canEdit={canEdit}
                        selectedBlockId={selectedBlockId}
                        onSelect={selectBlock}
                        onAddChild={(parentId) => {
                          setTargetParentId(parentId);
                          setActiveTab('add');
                        }}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        ) : null}

        {activeTab === 'add' ? (
          <div className="space-y-3">
            {targetParentNode ? (
              <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-[#FAF9F6] px-2.5 py-2 text-[11px]">
                <span className="truncate text-zinc-700">
                  Adding inside <strong>{targetParentNode.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setTargetParentId(null)}
                  className="font-semibold text-[#111111] hover:underline"
                >
                  Reset
                </button>
              </div>
            ) : null}

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search 18 Klido blocks…"
                className="w-full rounded-md border border-zinc-300 bg-white py-1.5 pl-8 pr-2.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              {filteredDefs.map((def) => (
                <button
                  key={def.type}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    addBlock(def.type, targetParentId);
                    setTargetParentId(null);
                    setActiveTab('layers');
                  }}
                  className="w-full rounded-md border border-zinc-200 bg-white p-2.5 text-left transition-colors hover:border-[#111111] hover:bg-[#FAF9F6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#111111]">
                      {def.displayName}
                    </span>
                    <span className="text-[10px] text-zinc-500">{def.category}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-600">
                    {def.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'saved' ? (
          <div className="space-y-3">
            {canEdit && selectedNode ? (
              <button
                type="button"
                onClick={() => onSaveSelectedAsTemplate(selectedNode)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-300 bg-[#FAF9F6] px-3 py-2 text-xs font-medium text-[#111111] hover:bg-zinc-100"
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span>Save &ldquo;{selectedNode.name}&rdquo; as Template</span>
              </button>
            ) : null}

            {savedSections.length === 0 ? (
              <div className="rounded-md border border-dashed border-zinc-300 px-3 py-8 text-center text-xs text-zinc-500">
                No reusable sections saved yet. Select any section on the canvas and save it here for reuse across Klido pages.
              </div>
            ) : (
              <div className="space-y-2">
                {savedSections.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-md border border-zinc-200 bg-white p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#111111]">
                          {tpl.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {tpl.category} · {tpl.block.type}
                        </p>
                      </div>
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => onDeleteSavedTemplate(tpl.id)}
                          title="Remove saved section"
                          className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => {
                          insertBlockNode(tpl.block, targetParentId);
                          setActiveTab('layers');
                        }}
                        className="mt-2 w-full rounded bg-[#111111] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-zinc-800"
                      >
                        Insert onto Page
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
