# Transcription

TQ provides real-time audio transcription powered by Deepgram AI.

## Live Transcription

1. In New Session, click **Start Transcribing**.
2. Allow microphone access when prompted by the browser.
3. Speak clearly — the transcription appears in real-time.
4. Use **Pause** to temporarily stop, then **Resume** to continue.
5. Click **Stop** when finished.

## Audio Upload

1. Click the dropdown arrow next to "Start Transcribing" and select **Upload Audio**.
2. Drag and drop an audio file or click to browse.
3. Supported formats: WebM, MP3, MP4, WAV.
4. Maximum file size: 100MB.
5. Processing time depends on file length (typically 1-2 minutes).

## Editing Transcription

- After transcription completes, the text is editable.
- Click on the transcription area to make changes.
- Changes are saved when you create a session or document.

## Transcription Quota

- Each tenant has a monthly transcription minute quota (default: 60 minutes/month).
- You can check remaining minutes in the session creation area.
- A warning is shown when you reach 80% of your quota.
- At 100% usage, new transcriptions are disabled until the quota resets.
- Quota resets monthly based on the billing cycle.
- Uploaded audio files count toward the quota based on their duration.
- To increase your quota, upgrade your plan via the Stripe Portal (Hub > Transcription Usage > Manage Subscription).

## Audio Privacy

- Audio files are stored temporarily in Supabase storage.
- Audio files are automatically deleted 24 hours after upload for privacy compliance.
- Only the text transcription is permanently stored.
