# Clinical Notes

Clinical notes are medical documentation records created from session transcriptions. They allow you to produce structured, professional clinical documents using templates that the AI fills automatically based on what was discussed during the consultation.

## Creating a Clinical Note

1. Open a completed session that has a transcription.
2. Click **Create Documents**.
3. Choose the **Clinical Note** document type.
4. Select a template from the list. The template defines the structure of your note (e.g., consultation note, treatment plan, follow-up).
5. The AI reads the session transcription and fills in the template placeholders automatically.
6. Review the generated content carefully. Edit any sections that need adjustment.
7. Save the clinical note.

You can create multiple clinical notes from the same session (for example, one consultation note and one treatment plan).

## How AI Template Filling Works

When you select a template for a clinical note, the AI processes it in the following way:

1. System variables (like `$patient.fullName$` or `$me.fullName$`) are replaced with actual data from the system.
2. AI placeholders (like `[Chief Complaint]` or `[Physical Examination Findings]`) are filled by the AI using the session transcription. The AI extracts the relevant information from the transcription and writes it into each placeholder.
3. AI instructions (like `(Be concise, use medical terminology)`) guide how the AI writes the content but are removed from the final document.

The quality of the AI output depends directly on the quality of the transcription. If the transcription is accurate and detailed, the AI will produce better clinical notes. Always review and edit the transcription before generating documents.

## Using the Rich Text Editor

Clinical notes use a TipTap-based rich text editor with the following formatting options:

- **Bold** and **Italic** text for emphasis.
- **Headings** (H1, H2, H3) to organize sections.
- **Bullet lists** and **numbered lists** for structured information.
- **Tables** for tabular data (measurements, lab results).
- Standard text formatting such as alignment and indentation.

To use these features, select the text and use the toolbar buttons, or use keyboard shortcuts (Ctrl+B for bold, Ctrl+I for italic, etc.). The editor works similarly to common word processors.

## Clinical Note vs. Prevention Document

TQ supports two types of medical documents:

- **Clinical Note**: A record of a consultation, examination, diagnosis, or treatment plan. It is clinical documentation meant for the patient's medical record. Examples: consultation note, initial assessment, follow-up note.
- **Prevention Document**: A document focused on preventive care recommendations, wellness plans, or aftercare instructions for the patient. It is patient-facing and often written in simpler language.

Both use the same template system and AI filling, but they serve different purposes and are stored in separate sections.

## Printing and PDF Export

- Click the **print icon** in the note editor toolbar to print the clinical note.
- The browser's native print dialog opens. To save as PDF, choose "Save as PDF" in the print destination.
- The print layout is optimized for **A4 paper** with **2cm margins** on all sides.
- The font used is **Inter** for clean, professional readability.
- The header includes: clinical note number (e.g., CLN000001), patient full name, and the date.
- The footer includes a standard disclaimer.
- **Note**: The clinic logo does not appear on printed clinical notes. There is no server-side PDF generation; printing relies on the browser's print functionality.

For best PDF results, use Chrome or Edge and select "Save as PDF" in the print dialog. Disable "Headers and footers" in the print options to avoid browser-added URLs or dates overlapping with the document.

## Patient Data Privacy

- All clinical note data is stored within your clinic's private, isolated database tenant.
- Other clinics on the TQ platform cannot access your data. Each clinic has a completely separate data environment.
- Audio files are automatically deleted after 24 hours. Only the text transcription and documents are permanently stored.
- Always follow your local regulations (such as LGPD in Brazil or HIPAA where applicable) regarding patient data handling.

## Viewing and Managing Clinical Notes

- Access all clinical notes from **Documents > Clinical Notes** in the sidebar.
- Search by note number (CLN000001), patient name, or content keywords.
- Click on a note to view or edit it.
- Each note is linked to its originating session, so you can always trace back to the original consultation.
- Clinical notes are numbered sequentially and uniquely within your clinic.

## Troubleshooting

- **AI-generated content is inaccurate or incomplete**: This is usually caused by poor transcription quality. Go back to the session, review and improve the transcription text, then create a new clinical note. Better input produces better output.
- **Formatting looks wrong when printing**: Make sure you are using Chrome or Edge for printing. In the print dialog, set paper size to A4, margins to Default, and disable "Headers and footers". If the layout still looks off, try zooming the print preview to 100%.
- **Cannot edit a clinical note**: Check that you have the correct permissions (Admin or Manager role). Operations users may have view-only access.
- **Clinical note is blank after AI filling**: Verify that the session actually has transcription text. If the transcription is empty, the AI has nothing to work with. Also check that the template contains AI placeholders (text in square brackets like `[Diagnosis]`).
- **Print does not include the full document**: Long documents may span multiple pages. Make sure "Background graphics" is enabled in the print dialog if the note uses any colored elements.

## Tips

- Review the transcription before generating a clinical note. Correcting transcription errors takes less time than fixing the entire generated document.
- Use specific, well-structured templates for consistent clinical documentation across your clinic.
- You can create a clinical note and a quote from the same session — the transcription feeds both documents.
- If you regularly create the same type of clinical note, save it as a template so you can reuse the structure.

## Frequently Asked Questions

- **Can I edit a clinical note after saving?** Yes. You can open any clinical note and make edits at any time.
- **Can I create a clinical note without a transcription?** You need a session with transcription text to use AI template filling. However, you can create a session, skip the transcription, and manually write the clinical note content in the editor.
- **Is the patient data shared with the AI?** The transcription text is sent to the AI for processing, but it is not stored by the AI provider. The data remains in your clinic's isolated environment.
- **Can I use my own templates?** Yes. Go to Templates in the sidebar and create your own templates with custom placeholders. See the Templates documentation for details on the template syntax.
- **Does the clinical note show on the patient's landing page?** No. Clinical notes are internal medical documents. Only quotes can be shared via landing pages.
