import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '../utils/cn'
import { Button } from './Button'
import { Card, CardHeader, CardContent, CardTitle } from './Card'

interface TemplateEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  readonly?: boolean
  minHeight?: string
  showVariables?: boolean
}

// Available template variables
const TEMPLATE_VARIABLES = {
  Patient: [
    { label: 'Patient Name', value: '$patient.name$' },
    { label: 'Patient Email', value: '$patient.email$' },
    { label: 'Patient Phone', value: '$patient.phone$' }
  ],
  Date: [
    { label: 'Current Date', value: '$date.now$' },
    { label: 'Session Date', value: '$date.session$' }
  ],
  Profile: [
    { label: 'Doctor Name', value: '$profile.name$' }
  ]
}

const TEMPLATE_HELP = [
  {
    type: 'Placeholders',
    syntax: '[placeholder]',
    description: 'Will be filled with information from the session dialogue',
    example: '[reason for visit] → "dental cleaning and check-up"',
    color: 'text-blue-600'
  },
  {
    type: 'Instructions',
    syntax: '(instruction)',
    description: 'Guide the AI behavior - will not appear in final output',
    example: '(Only include if mentioned in transcript)',
    color: 'text-gray-500'
  },
  {
    type: 'Variables',
    syntax: '$variable$',
    description: 'System variables filled automatically',
    example: '$patient.name$ → "João Silva"',
    color: 'text-green-600'
  }
]

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  content,
  onChange,
  placeholder = "Create your template using [placeholders], $variables$, and (instructions)...",
  className,
  readonly = false,
  minHeight = "300px",
  showVariables = true
}) => {
  const [showHelp, setShowHelp] = useState(false)
  const [showVariablesPanel, setShowVariablesPanel] = useState(false)

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

  const insertVariable = (variable: string) => {
    if (editor) {
      editor.chain().focus().insertContent(variable + ' ').run()
    }
  }

  const insertPlaceholder = () => {
    if (editor) {
      editor.chain().focus().insertContent('[your placeholder here] ').run()
    }
  }

  const insertInstruction = () => {
    if (editor) {
      editor.chain().focus().insertContent('(instruction for AI) ').run()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      {!readonly && (
        <div className="border border-gray-200 rounded-md bg-gray-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Text formatting */}
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
            </div>

            <div className="w-px h-4 bg-gray-300" />

            {/* Lists */}
            <div className="flex items-center gap-1">
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

            <div className="w-px h-4 bg-gray-300" />

            {/* Template specific tools */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={insertPlaceholder}
            >
              [Placeholder]
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={insertInstruction}
            >
              (Instruction)
            </Button>

            {showVariables && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowVariablesPanel(!showVariablesPanel)}
              >
                $Variables$
              </Button>
            )}

            <div className="w-px h-4 bg-gray-300" />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
            >
              ?
            </Button>
          </div>
        </div>
      )}

      {/* Variables Panel */}
      {showVariablesPanel && !readonly && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available Variables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(TEMPLATE_VARIABLES).map(([category, variables]) => (
                <div key={category}>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
                  <div className="space-y-1">
                    {variables.map((variable) => (
                      <button
                        key={variable.value}
                        type="button"
                        onClick={() => insertVariable(variable.value)}
                        className="block w-full text-left text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-green-600 font-mono"
                      >
                        {variable.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Panel */}
      {showHelp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Template Syntax Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TEMPLATE_HELP.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{item.type}:</span>
                    <code className={cn("text-xs px-1 py-0.5 bg-gray-100 rounded", item.color)}>
                      {item.syntax}
                    </code>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                  <p className="text-xs text-gray-500 font-mono">{item.example}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <div
        className={cn(
          "border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500",
          readonly && "bg-gray-50"
        )}
      >
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

      {/* Syntax highlighting styles */}
      <style jsx>{`
        .template-editor .ProseMirror {
          outline: none;
        }

        /* Placeholder highlighting */
        .template-editor .ProseMirror :is(p, h1, h2, h3, h4, h5, h6, li) {
          background: linear-gradient(to right,
            transparent 0%,
            rgba(59, 130, 246, 0.1) 0%,
            rgba(59, 130, 246, 0.1) 100%,
            transparent 100%
          );
        }
      `}</style>
    </div>
  )
}

export default TemplateEditor