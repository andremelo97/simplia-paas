/**
 * Converts plain text with line breaks to HTML suitable for TipTap editor
 *
 * Rules:
 * - Double line breaks (\n\n) create new paragraphs with <p></p> spacer between sections
 * - Single line breaks (\n) create separate <p> tags (no <br>)
 * - **text** is converted to <strong>text</strong>
 * - ###text is converted to <strong>text</strong>
 * - Preserves formatting and structure matching simple-editor output
 */
export function plainTextToHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '<p></p>'
  }

  // Convert **bold** to <strong>bold</strong>
  let textWithFormatting = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  
  // Convert ###text to <strong>text</strong>
  textWithFormatting = textWithFormatting.replace(/###(.+?)(?=\n|$)/g, '<strong>$1</strong>')

  // Split by double line breaks to get sections
  const sections = textWithFormatting.split(/\n\n+/)

  // Convert each section
  const htmlSections = sections
    .filter(section => section.trim()) // Remove empty sections
    .map(section => {
      // Split single line breaks into separate paragraphs (no <br>)
      const lines = section
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line) // Remove empty lines

      // Each line becomes a <p>
      return lines.map(line => `<p>${line}</p>`).join('')
    })

  // Join sections with empty <p></p> spacer (matches simple-editor spacing)
  return htmlSections.join('<p></p>') || '<p></p>'
}

