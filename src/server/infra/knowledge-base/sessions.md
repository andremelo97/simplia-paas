# Sessions

Sessions are the core workflow unit in TQ. Each session represents a consultation with a patient.

## Creating a Session

1. Navigate to **New Session** from the sidebar. *(Note: New Session is hidden for Operations role users.)*
2. **Select or create a patient**: Search for an existing patient or create a new one by entering their name.
3. **Start transcription**: Click "Start Transcribing" to begin real-time audio transcription, or use "Upload Audio" to upload a pre-recorded file.
4. **Review transcription**: The transcription appears in real-time. You can edit it after stopping.
5. **Create documents**: Use "Create Documents" to generate quotes, clinical notes, or prevention documents from the transcription.

## Transcription

- TQ uses Deepgram for speech-to-text transcription.
- Supported audio formats: WebM, MP3, MP4, WAV.
- Maximum file size: 100MB.
- You can pause and resume live transcription.
- Transcription text can be manually edited after completion.

## Session Status

- **Draft**: Session created but not yet completed.
- **Pending**: Session is being processed.
- **Completed**: Session is finalized with all documents.
- **Cancelled**: Session was cancelled.

## Session List

- View all sessions from the Sessions page.
- Filter by status, date range, or patient.
- Search by session number (e.g., SES000001) or patient name.
- Click on a session to view or edit its details.

## Draft Auto-Save

- Session drafts are automatically saved to your browser's local storage.
- Auto-save is debounced to avoid excessive writes.
- Drafts are kept for a maximum of 24 hours.
- If you close the browser and return, your draft will be restored.

## Tips

- You can create multiple documents from a single session.
- Draft sessions are auto-saved so you won't lose your work.
- Audio files are automatically deleted after 24 hours for privacy.
