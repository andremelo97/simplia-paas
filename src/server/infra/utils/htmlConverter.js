/**
 * HTML Converter Utilities
 *
 * Utilities for converting between HTML and plain text, specifically designed
 * for AI processing and TipTap editor compatibility.
 */

/**
 * Converts HTML content to plain text for AI processing
 * Preserves paragraph breaks and line structure while removing HTML tags
 *
 * @param {string} html - HTML content from TipTap editor
 * @returns {string} - Clean plain text suitable for AI processing
 */
function stripHtmlToText(html) {
  if (!html) return '';

  return html
    .replace(/<br\s*\/?>/gi, '\n')                    // <br> → line break
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')           // </p><p> → paragraph break
    .replace(/<\/h[1-6]>\s*<h[1-6][^>]*>/gi, '\n\n') // heading breaks
    .replace(/<\/li>\s*<li[^>]*>/gi, '\n')           // list items
    .replace(/<[^>]*>/g, '')                         // remove all HTML tags
    .replace(/&nbsp;/g, ' ')                         // &nbsp; → space
    .replace(/&amp;/g, '&')                          // &amp; → &
    .replace(/&lt;/g, '<')                           // &lt; → <
    .replace(/&gt;/g, '>')                           // &gt; → >
    .replace(/&quot;/g, '"')                         // &quot; → "
    .replace(/\n\s*\n/g, '\n\n')                     // normalize multiple breaks
    .trim()
}

/**
 * Converts plain text back to HTML format for TipTap editor
 * Maintains basic structure and formatting for quote editing
 * Also cleans up any markdown artifacts that might slip through
 *
 * @param {string} text - Plain text from AI response
 * @returns {string} - HTML formatted for TipTap editor
 */
function textToHtml(text) {
  if (!text) return '';

  // Clean up markdown artifacts first
  let cleanText = text
    .replace(/^```[\w]*\n?/gm, '')                   // Remove opening code blocks
    .replace(/\n?```$/gm, '')                        // Remove closing code blocks
    .replace(/^\*\*(.*?)\*\*$/gm, '$1')              // Remove **bold** markers
    .replace(/^\*(.*?)\*$/gm, '$1')                  // Remove *italic* markers
    .replace(/^#{1,6}\s+/gm, '')                     // Remove # headers
    .replace(/^\-\s+/gm, '')                         // Remove - bullet points
    .replace(/^\*\s+/gm, '')                         // Remove * bullet points
    .replace(/^\d+\.\s+/gm, '')                      // Remove numbered lists
    .trim()

  return cleanText
    .split('\n\n')                                   // Split paragraphs
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0)
    .map(paragraph => {
      // Convert single line breaks to <br> within paragraphs
      const content = paragraph.replace(/\n/g, '<br>')
      return `<p class="editor-paragraph" style="text-align: left;">${content}</p>`
    })
    .join('')
}

/**
 * Strips HTML tags completely (more aggressive than stripHtmlToText)
 * Useful for search indexing or when only text content is needed
 *
 * @param {string} html - HTML content
 * @returns {string} - Plain text without any formatting
 */
function stripHtmlCompletely(html) {
  if (!html) return '';

  return html
    .replace(/<[^>]*>/g, '')                         // remove all HTML tags
    .replace(/&nbsp;/g, ' ')                         // &nbsp; → space
    .replace(/&amp;/g, '&')                          // &amp; → &
    .replace(/&lt;/g, '<')                           // &lt; → <
    .replace(/&gt;/g, '>')                           // &gt; → >
    .replace(/&quot;/g, '"')                         // &quot; → "
    .replace(/\s+/g, ' ')                            // normalize whitespace
    .trim()
}

module.exports = {
  stripHtmlToText,
  textToHtml,
  stripHtmlCompletely
}