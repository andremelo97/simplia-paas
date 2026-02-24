import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '../utils/cn'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  readonly?: boolean
  minHeight?: string
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = "Start typing...",
  className,
  readonly = false,
  minHeight = "9.375rem"
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder
      })
    ],
    content,
    editable: !readonly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  if (!editor) {
    return null
  }

  return (
    <div
      className={cn(
        "border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500",
        readonly && "bg-gray-50",
        className
      )}
    >
      {!readonly && (
        <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                "px-2 py-1 text-sm rounded hover:bg-gray-200",
                editor.isActive('bold') && "bg-gray-300 font-semibold"
              )}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                "px-2 py-1 text-sm rounded hover:bg-gray-200 italic",
                editor.isActive('italic') && "bg-gray-300"
              )}
            >
              I
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "px-2 py-1 text-sm rounded hover:bg-gray-200",
                editor.isActive('bulletList') && "bg-gray-300"
              )}
            >
              •
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "px-2 py-1 text-sm rounded hover:bg-gray-200",
                editor.isActive('orderedList') && "bg-gray-300"
              )}
            >
              1.
            </button>
          </div>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none p-4 focus:outline-none",
          "prose-headings:text-gray-900 prose-p:text-gray-700",
          readonly && "cursor-default"
        )}
        style={{ minHeight }}
      />
    </div>
  )
}

export default RichTextEditor