'use client';

import clsx from 'clsx';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered,
  Quote,
  Strikethrough,
} from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

export function RichEditor({
  value = '',
  onChange,
  placeholder = 'Write something…',
  className,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      const isEmpty = editor.state.doc.textContent.trim().length === 0;
      onChange?.(isEmpty ? '' : html);
    },
    editorProps: {
      attributes: {
        class:
          'tiptap min-h-[120px] max-w-none px-3 py-2.5 text-sm leading-6 text-fg focus:outline-none [&_a]:text-accent [&_a]:underline [&_p]:my-1.5 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-borderStrong [&_blockquote]:pl-3 [&_blockquote]:text-fgMuted [&_code]:rounded [&_code]:bg-surfaceSoft [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (!value && editor.getText().length > 0) {
      editor.commands.clearContent(true);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className={clsx('rounded-lg border border-border bg-surface', className)}>
        <div className="border-b border-divider px-2 py-1.5 text-xs text-muted">
          Loading editor…
        </div>
        <div className="min-h-[120px] px-3 py-2.5 text-sm text-subtle">{placeholder}</div>
      </div>
    );
  }

  function setLink() {
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-surface focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-divider p-1">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          aria="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria="Heading 1"
          label="H1"
        />
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria="Heading 2"
          label="H2"
        />

        <Divider />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          aria="Bulleted list"
        >
          <ListIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          aria="Numbered list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          aria="Quote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          active={editor.isActive('link')}
          onClick={setLink}
          aria="Insert link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({ active, onClick, aria, children, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      title={aria}
      className={clsx(
        'inline-flex h-7 min-w-[28px] items-center justify-center rounded px-1.5 text-xs font-semibold transition-colors',
        active
          ? 'bg-accentSoft text-accent'
          : 'text-muted hover:bg-surfaceHover hover:text-fg'
      )}
    >
      {label || children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px bg-divider" />;
}
