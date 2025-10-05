"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Selection } from "@tiptap/extensions"
import { AllSelection } from "@tiptap/pm/state"

// --- UI Primitives ---
import { Button } from "@shared/components/tiptap-ui-primitive/button"
import { Spacer } from "@shared/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@shared/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { HorizontalRule } from "@shared/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@shared/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@shared/components/tiptap-node/list-node/list-node.scss"
import "@shared/components/tiptap-node/heading-node/heading-node.scss"
import "@shared/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@shared/components/tiptap-ui/heading-dropdown-menu"
import { ListDropdownMenu } from "@shared/components/tiptap-ui/list-dropdown-menu"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@shared/components/tiptap-ui/color-highlight-popover"
import { MarkButton } from "@shared/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@shared/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@shared/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@shared/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@shared/tiptap-icons/highlighter-icon"

// --- Hooks ---
import { useIsMobile } from "@shared/hooks/use-mobile"
import { useWindowSize } from "@shared/hooks/use-window-size"
import { useCursorVisibility } from "@shared/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@shared/components/tiptap-templates/simple/theme-toggle"


// --- Styles ---
import "@shared/components/tiptap-templates/simple/simple-editor.scss"


const MainToolbarContent = ({
  onHighlighterClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>


      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        <HighlighterIcon className="tiptap-button-icon" />
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    <ColorHighlightPopoverContent />
  </>
)

interface SimpleEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  readonly?: boolean
}

export function SimpleEditor({
  content = null,
  onChange,
  placeholder,
  readonly = false
}: SimpleEditorProps = {}) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter"
  >("main")
  const toolbarRef = React.useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editable: !readonly,
    content: content,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML())
      }
    },
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
        placeholder: placeholder || "Start typing...",
      },
      handleKeyDown: (view, event) => {
        // Enable Ctrl+A to select all
        if (event.ctrlKey && event.key === 'a') {
          const { state, dispatch } = view
          const allSelection = new AllSelection(state.doc)
          dispatch(state.tr.setSelection(allSelection))
          event.preventDefault()
          return true
        }
        return false
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        paragraph: {
          HTMLAttributes: {
            // class: 'editor-paragraph',  // COMMENTED: Prevents class injection, maintains compatibility with existing HTML
          },
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Typography,
      Selection,
    ],
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  // Update editor content when prop changes
  React.useEffect(() => {
    if (editor && content !== null && content !== undefined) {
      const currentContent = editor.getHTML()
      if (currentContent !== content) {
        console.log('🔄 [SimpleEditor] Updating content from prop')
        console.log('🔄 [SimpleEditor] Content preview:', content?.substring(0, 100))
        console.log('🔄 [SimpleEditor] Current editor content:', currentContent?.substring(0, 100))

        try {
          editor.commands.setContent(content)
          console.log('✅ [SimpleEditor] Content updated successfully')
          console.log('✅ [SimpleEditor] New editor HTML:', editor.getHTML()?.substring(0, 100))
        } catch (error) {
          console.error('❌ [SimpleEditor] Failed to set content:', error)
        }
      }
    }
  }, [editor, content])

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type="highlighter"
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}
