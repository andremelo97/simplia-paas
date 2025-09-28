import React from 'react'
import { SimpleEditor } from '@shared/components/tiptap-templates/simple/simple-editor'
import { cn } from '../utils/cn'

interface TemplateEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  readonly?: boolean
  minHeight?: string
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  content,
  onChange,
  placeholder = "Create your template using [placeholders], $variables$, and (instructions)...",
  className,
  readonly = false,
  minHeight = "400px"
}) => {
  return (
    <div className={cn("w-full", className)} style={{ minHeight }}>
      <div className="template-editor-constrained">
        <SimpleEditor
          content={content}
          onChange={onChange}
          placeholder={placeholder}
          readonly={readonly}
        />
      </div>
    </div>
  )
}

export default TemplateEditor