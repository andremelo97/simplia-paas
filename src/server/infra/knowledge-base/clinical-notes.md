# Clinical Notes

Clinical notes are medical documentation records created from session transcriptions.

## Creating a Clinical Note

1. From a session, click **Create Documents**.
2. Select a clinical note template or use AI to fill one automatically.
3. Edit the content using the rich text editor (TipTap).
4. Save the note.

## Features

- **Rich text editor**: Bold, italic, lists, headings, tables, and more.
- **Template-based**: Use pre-configured templates for consistent documentation.
- **AI-assisted**: Templates can be automatically filled using AI and the session transcription.
- **Print/PDF**: Clinical notes can be printed or exported to PDF.
- **Numbered**: Each note has a unique number (e.g., CLN000001).

## Viewing and Editing

- Access all clinical notes from **Documents > Clinical Notes**.
- Search by number, patient name, or content.
- Click on a note to view or edit it.
- Notes are linked to their originating session.

## Printing

- Click the print icon in the note editor to print.
- Printing uses the browser's native print dialog (`window.print()`).
- To save as PDF, choose "Save as PDF" in the browser's print dialog.
- The print layout is optimized for A4 paper with 2cm margins.
- Font used: Inter.
- Header includes: clinical note number, patient name, and date.
- Footer includes a disclaimer.
- **Note**: The clinic logo does not appear on printed clinical notes. There is no server-side PDF generation.

## Tips

- You can create multiple clinical notes per session.
- Use templates to standardize your documentation.
- The AI will fill template fields based on the transcription content.
