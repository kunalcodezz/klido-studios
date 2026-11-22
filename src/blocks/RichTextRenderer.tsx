import type { ReactNode } from 'react';
import type { TiptapDoc, TiptapNode } from '../schemas/tiptap';
import { isSafeUrl } from '../schemas/validation';

function renderTextWithMarks(node: TiptapNode, key: number): ReactNode {
  let content: ReactNode = node.text ?? '';
  if (!node.marks || node.marks.length === 0) {
    return <span key={key}>{content}</span>;
  }

  for (const mark of node.marks) {
    if (mark.type === 'bold') {
      content = <strong className="font-semibold text-[#0D1126]">{content}</strong>;
    } else if (mark.type === 'italic') {
      content = <em className="italic">{content}</em>;
    } else if (mark.type === 'underline') {
      content = <span className="underline underline-offset-2">{content}</span>;
    } else if (mark.type === 'strike') {
      content = <span className="line-through">{content}</span>;
    } else if (mark.type === 'code') {
      content = (
        <code className="rounded bg-[#F7F9FE] px-1.5 py-0.5 font-mono text-[0.9em] text-[#0D1126]">
          {content}
        </code>
      );
    } else if (mark.type === 'link' && isSafeUrl(mark.attrs.href)) {
      const isExternal = mark.attrs.href.startsWith('http');
      content = (
        <a
          href={mark.attrs.href}
          target={mark.attrs.target ?? (isExternal ? '_blank' : undefined)}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="font-medium text-[#123FFF] underline underline-offset-2 hover:text-[#0D31CC]"
        >
          {content}
        </a>
      );
    }
  }

  return <span key={key}>{content}</span>;
}

function renderTiptapNode(node: TiptapNode, index: number): ReactNode {
  const children = node.content?.map((child, i) => renderTiptapNode(child, i));

  switch (node.type) {
    case 'text':
      return renderTextWithMarks(node, index);
    case 'hardBreak':
      return <br key={index} />;
    case 'paragraph':
      return (
        <p key={index} className="leading-relaxed">
          {children && children.length > 0 ? children : <br />}
        </p>
      );
    case 'heading': {
      const level = Number(node.attrs?.level ?? 3);
      if (level <= 2) {
        return (
          <h2 key={index} className="text-xl font-bold tracking-tight text-[#0D1126]">
            {children}
          </h2>
        );
      }
      return (
        <h3 key={index} className="text-lg font-semibold text-[#0D1126]">
          {children}
        </h3>
      );
    }
    case 'bulletList':
      return (
        <ul key={index} className="list-disc space-y-1.5 pl-5">
          {children}
        </ul>
      );
    case 'orderedList':
      return (
        <ol key={index} className="list-decimal space-y-1.5 pl-5">
          {children}
        </ol>
      );
    case 'listItem':
      return <li key={index}>{children}</li>;
    case 'blockquote':
      return (
        <blockquote
          key={index}
          className="border-l-2 border-[#CFD6E6] pl-4 italic text-[#4A5268]"
        >
          {children}
        </blockquote>
      );
    case 'doc':
      return <>{children}</>;
    default:
      return null;
  }
}

export function RichTextRenderer({
  doc,
  className = '',
}: {
  doc: TiptapDoc | undefined | null;
  className?: string;
}) {
  if (!doc || !Array.isArray(doc.content) || doc.content.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {doc.content.map((node, index) => renderTiptapNode(node, index))}
    </div>
  );
}
