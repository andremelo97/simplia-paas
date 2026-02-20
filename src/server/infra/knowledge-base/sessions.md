# Sessions

Sessions are the core workflow unit in TQ. Each session represents a single consultation with a patient and holds the audio recording, transcription text, and all documents generated from that consultation.

## Creating a Session

1. Click **New Session** in the sidebar. (Note: the New Session button is hidden for users with the Operations role.)
2. **Select or create a patient**: Search for an existing patient by name, or create a new one by typing their name and confirming.
3. **Start transcription**: Click "Start Transcribing" to begin real-time audio transcription using your microphone. Alternatively, click the dropdown arrow next to the button and select "Upload Audio" to upload a pre-recorded file.
4. **Review the transcription**: The transcription text appears in real-time during live recording. After stopping, you can click on the text to edit and correct any errors.
5. **Create documents**: Click "Create Documents" to generate a quote, clinical note, or prevention document from the transcription. You can create multiple documents from the same session.

## Complete Workflow: Session to Document

1. Create a session and select the patient.
2. Record the consultation or upload the audio file.
3. Wait for the transcription to finish processing.
4. Review and edit the transcription text for accuracy.
5. Click "Create Documents" and choose the type of document you need (quote, clinical note, or prevention document).
6. Select a template — the AI will automatically fill in placeholders using the transcription content.
7. Review the generated document, make any final edits, and save.
8. Share the document: send a quote via landing page link, or print/export a clinical note as PDF.

You can repeat steps 5-8 to create additional documents from the same session.

## Session Status

- **Draft**: Session has been created but is still in progress. You can continue editing.
- **Pending**: Session is being processed (e.g., audio is being transcribed).
- **Completed**: Session is finalized with all documents generated.
- **Cancelled**: Session was cancelled and is no longer active.

## Session List

- View all sessions from the **Sessions** page in the sidebar.
- Filter by status, date range, or patient name.
- Search by session number (e.g., SES000001) or patient name.
- Click on any session to view or edit its details, transcription, and linked documents.

## Draft Auto-Save

- When you are creating or editing a session, your work is automatically saved to your browser's local storage.
- Auto-save happens as you type, with a small delay to avoid excessive writes.
- Drafts are kept for a maximum of **24 hours**.
- If you accidentally close the browser tab or your computer restarts, your draft will be restored when you return to the New Session page.
- After 24 hours, unsaved drafts are automatically cleared.

## Session Deletion

- You cannot delete a session that has quotes or clinical notes attached to it. You must delete the linked documents first before deleting the session.
- Draft sessions with no documents can be deleted or cancelled freely.

## Recording Tips for Best Results

- **Use a quiet environment**: Background noise (air conditioning, other conversations, music) reduces transcription accuracy.
- **Use a good microphone**: An external USB microphone or headset produces much better results than a built-in laptop microphone.
- **Speak clearly and at a moderate pace**: Avoid mumbling or speaking too quickly. The AI works best with clear, natural speech.
- **Position the microphone correctly**: Keep it 15-30 cm from your mouth. Avoid placing it next to the keyboard or on a vibrating surface.
- **Minimize interruptions**: If multiple people are speaking at the same time, the transcription may mix up the speakers.

## Troubleshooting

- **Transcription failed or shows no text**: Check your microphone permissions in the browser. Go to browser settings > Privacy > Microphone and ensure the site is allowed. Also verify your microphone is working by testing it in another app.
- **Audio file too large (over 100MB)**: Compress the audio file before uploading, or split a long recording into shorter segments. Use MP3 format for smaller file sizes.
- **Audio format not supported**: TQ accepts WebM, MP3, MP4, and WAV files. If your file is in a different format (e.g., AAC, OGG, FLAC), convert it to MP3 or WAV using a free online converter before uploading.
- **Session is stuck in Pending status**: This usually means the audio is still being processed. Wait a few minutes. If it remains stuck for more than 10 minutes, try refreshing the page. If the problem persists, contact support.
- **Draft was not restored**: Drafts are stored in your browser's local storage. If you cleared your browser data or used a different browser/device, the draft will not be available. Always save important sessions before closing.
- **Cannot create a new session**: Verify that your user role is Admin or Manager. Operations users cannot create sessions. Also check that your transcription quota has not been exceeded.

## Tips

- You can create multiple documents (quotes, clinical notes, prevention documents) from a single session.
- Audio files are automatically deleted after 24 hours for privacy. Only the text transcription is permanently stored.
- Use the session number (e.g., SES000001) to quickly find a specific session in the search.
- If you need to redo a transcription, you can upload a new audio file to the same session.

## Frequently Asked Questions

- **Can I have more than one session per patient?** Yes. Each consultation should be its own session. The patient's name links all their sessions together.
- **What happens if I lose internet during recording?** The live transcription requires an internet connection. If you lose connection, the recording may stop. Check your transcription text and re-record if needed.
- **Can I edit the transcription after creating documents?** You can edit the transcription text at any time, but documents already created will not be automatically updated. You would need to create a new document to reflect the changes.
- **How long is my audio stored?** Audio files are automatically deleted 24 hours after upload. The text transcription is kept permanently.
