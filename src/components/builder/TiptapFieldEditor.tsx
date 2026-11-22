import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Unlink,
} from 'lucide-react';
import { createTiptapParagraph, type TiptapDoc } from '../../schemas/tiptap';
import { isSafeUrl } from '../../schemas/validation';

interface TiptapFieldEditorProps {
  value: TiptapDoc | undefined;
  disabled?: boolean;
  onChange: (nextDoc: TiptapDoc) => void;
}

export function TiptapFieldEditor({
  value,
  disabled = false,
  onChange,
}: TiptapFieldEditorProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const normalizedValue =
    value && value.type === 'doc' ? value : createTiptapParagraph('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        validate: (href) => isSafeUrl(href),
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: normalizedValue,
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          'min-h-[110px] max-h-[240px] overflow-y-auto px-3 py-2.5 text-xs leading-relaxed text-[#111111] focus:outline-none prose prose-sm max-w-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON() as TiptapDoc;
      onChange(json);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  // Keep external updates (Undo/Redo or block switch) synchronized without feedback loops
  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(normalizedValue);
    if (current !== incoming) {
      editor.commands.setContent(normalizedValue, { emitUpdate: false });
    }
  }, [editor, normalizedValue]);

  const applySafeLink = () => {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
      setLinkModalOpen(false);
      setLinkError(null);
      return;
    }

    if (!isSafeUrl(trimmed)) {
      setLinkError('URL must start with https://, http://, mailto:, tel:, /, or #.');
      return;
    }

    const isExternal = trimmed.startsWith('http://') || trimmed.startsWith('https://');
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: trimmed,
        target: isExternal ? '_blank' : '_self',
        rel: isExternal ? 'noopener noreferrer' : undefined,
      })
      .run();

    setLinkModalOpen(false);
    setLinkError(null);
    setLinkUrl('');
  };

  if (!editor) {
    return (
      <div className="h-[140px] animate-pulse rounded-md border border-zinc-200 bg-zinc-50" />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-md border border-zinc-300 bg-white ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-[#FAF9F6] px-2 py-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
          className={`rounded p-1.5 text-zinc-700 hover:bg-zinc-200/70 ${
            editor.isActive('bold') ? 'bg-[#111111] text-white hover:bg-[#111111]' : ''
          }`}
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
          className={`rounded p-1.5 text-zinc-700 hover:bg-zinc-200/70 ${
            editor.isActive('italic') ? 'bg-[#111111] text-white hover:bg-[#111111]' : ''
          }`}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
          className={`rounded p-1.5 text-zinc-700 hover:bg-zinc-200/70 ${
            editor.isActive('bulletList') ? 'bg-[#111111] text-white hover:bg-[#111111]' : ''
          }`}
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
          className={`rounded p-1.5 text-zinc-700 hover:bg-zinc-200/70 ${
            editor.isActive('orderedList') ? 'bg-[#111111] text-white hover:bg-[#111111]' : ''
          }`}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
          className={`rounded p-1.5 text-zinc-700 hover:bg-zinc-200/70 ${
            editor.isActive('blockquote') ? 'bg-[#111111] text-white hover:bg-[#111111]' : ''
          }`}
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-zinc-300" />
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            const currentHref = (editor.getAttributes('link').href as string | undefined) ?? '';
            setLinkUrl(currentHref);
            setLinkError(null);
            setLinkModalOpen((v) => !v);
          }}
          title="Insert link"
          className={`rounded p-1.5 text-zinc-700 hover:bg-zinc-200/70 ${
            editor.isActive('link') ? 'bg-[#111111] text-white hover:bg-[#111111]' : ''
          }`}
        >
          <Link2 className="h-3.5 w-3.5" />
        </button>
        {editor.isActive('link') ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => editor.chain().focus().unsetLink().run()}
            title="Remove link"
            className="rounded p-1.5 text-zinc-700 hover:bg-zinc-200/70"
          >
            <Unlink className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {linkModalOpen ? (
        <div className="border-b border-zinc-200 bg-zinc-50 p-2">
          <div className="flex items-center gap-1.5">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                setLinkError(null);
              }}
              placeholder="https://klido.in or /services"
              className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs focus:border-[#111111] focus:outline-none"
            />
            <button
              type="button"
              onClick={applySafeLink}
              className="rounded bg-[#111111] px-2.5 py-1 text-[11px] font-medium text-white hover:bg-zinc-800"
            >
              Apply
            </button>
          </div>
          {linkError ? <p className="mt-1 text-[11px] text-red-600">{linkError}</p> : null}
        </div>
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}
