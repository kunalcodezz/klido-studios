import { Plus } from 'lucide-react';
import { PageRenderer } from '../../blocks/PageRenderer';
import { useEditorStore } from '../../stores/editorStore';

interface CenterCanvasProps {
  canEdit: boolean;
}

export function CenterCanvas({ canEdit }: CenterCanvasProps) {
  const {
    content,
    viewport,
    zoom,
    fullPreview,
    selectedBlockId,
    selectBlock,
    addBlock,
  } = useEditorStore();

  const frameWidthClass =
    viewport === 'mobile'
      ? 'w-[390px]'
      : viewport === 'tablet'
        ? 'w-[768px]'
        : 'w-full max-w-[1280px]';

  return (
    <main
      onClick={() => {
        if (!fullPreview) selectBlock(null);
      }}
      className="relative flex-1 overflow-auto bg-[#EAE8E2] p-6"
    >
      <div className="mx-auto flex flex-col items-center">
        <div
          style={
            zoom !== 1
              ? {
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  width: zoom === 0.75 ? '133.33%' : '200%',
                }
              : undefined
          }
          className="flex flex-col items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`min-h-[640px] overflow-hidden rounded-md border border-zinc-300/80 bg-white shadow-sm transition-all ${frameWidthClass}`}
          >
            <PageRenderer
              content={content}
              viewport={viewport}
              editorMode={!fullPreview}
              selectedBlockId={selectedBlockId}
              onSelectBlock={(id) => selectBlock(id)}
            />
          </div>

          {!fullPreview && canEdit ? (
            <div className="mt-6">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addBlock('text');
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-[#111111] shadow-xs hover:bg-zinc-50"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Append Rich Text Section</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
