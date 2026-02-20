# Transcription

TQ provides real-time audio transcription powered by Deepgram AI. You can either record live during a consultation or upload a pre-recorded audio file. The AI automatically detects the language being spoken and converts speech to text.

## Live Transcription

1. In the New Session page, click **Start Transcribing**.
2. Your browser will ask for microphone permission — click "Allow".
3. Speak clearly. The transcription appears on screen in real-time as you talk.
4. Use the **Pause** button to temporarily stop recording (e.g., if you need to take a phone call). Click **Resume** to continue recording from where you left off. The transcription will continue seamlessly.
5. Click **Stop** when the consultation is finished.

The transcription processes for a few seconds after you stop, then the full text is displayed for review.

## Audio Upload

1. Click the dropdown arrow next to "Start Transcribing" and select **Upload Audio**.
2. Drag and drop an audio file into the upload area, or click to browse your files.
3. Supported formats: **WebM, MP3, MP4, WAV**.
4. Maximum file size: **100MB**.
5. Processing time depends on the audio length. A 30-minute recording typically takes 1-2 minutes to process.

After processing completes, the transcription text appears and is ready for review.

## Editing the Transcription

- After transcription completes (either live or from an upload), the text becomes fully editable.
- Click directly on the transcription text area to make corrections.
- Fix any words the AI may have misheard, add punctuation, or adjust formatting.
- Your edits are saved when you create a document from the session or when the auto-save triggers.
- Take time to review the transcription before generating documents, since the AI uses this text to fill templates. Better transcription quality means better documents.

## Language Detection

- TQ automatically detects the language being spoken. You do not need to select a language before recording.
- Supported languages include Portuguese and English, among others.
- For best results, try to speak predominantly in one language during a session. Mixing languages frequently may reduce accuracy.

## Audio Quality Tips

Getting a clean, accurate transcription starts with good audio quality. Follow these tips:

- **Use an external microphone**: A USB microphone or headset produces significantly better results than a built-in laptop or phone microphone. Even an inexpensive external mic makes a big difference.
- **Choose a quiet room**: Close doors and windows. Turn off fans, air conditioning, or music if possible. Background noise is the number one cause of transcription errors.
- **Microphone placement**: Position the microphone 15-30 cm from the speaker's mouth. Avoid placing it on a desk where it picks up keyboard sounds or vibrations.
- **Speak clearly and naturally**: Avoid mumbling, whispering, or speaking too fast. A natural, moderate pace works best.
- **One speaker at a time**: When multiple people talk simultaneously, the AI may merge or confuse the speech. Take turns speaking when possible.
- **Test before the consultation**: Do a quick 10-second test recording to verify your microphone is working and the audio level is adequate.

## Transcription Quota

- Each clinic has a monthly transcription minute quota based on your subscription plan (default: 60 minutes per month).
- You can check your remaining minutes in the session creation area before starting a new transcription.
- A **warning** appears when you reach **80%** of your monthly quota, reminding you to manage your usage.
- At **100%** usage, new transcriptions are **disabled** until the quota resets at the start of your next billing cycle.
- Both live recordings and uploaded audio files count toward the quota based on their duration.
- To increase your quota, upgrade your plan via the Stripe Portal. Access it from Hub > Transcription Usage > Manage Subscription.

## Audio Privacy

- Audio files are stored temporarily and securely in cloud storage.
- Audio files are **automatically deleted 24 hours** after upload for privacy compliance.
- Only the text transcription is permanently stored in your clinic's private database.
- Your audio and transcription data is isolated to your clinic's tenant and is not accessible by other clinics.

## Troubleshooting

- **"Microphone not found" or no audio recording**: Make sure your microphone is connected and selected as the default input device in your operating system. In the browser, go to Settings > Privacy > Microphone and ensure the site has permission. Try refreshing the page after granting permission.
- **Transcription text is empty or very short**: This usually means the microphone was not picking up sound properly. Check that the correct microphone is selected (not a disconnected Bluetooth device, for example). Do a test recording first.
- **Audio format not supported**: TQ accepts WebM, MP3, MP4, and WAV. If your file is in another format (AAC, OGG, FLAC, M4A), convert it to MP3 or WAV using a free tool (such as an online audio converter) before uploading.
- **Upload fails or times out**: If the file is close to 100MB, try compressing it. Convert to MP3 format which is smaller than WAV. Also check your internet connection — large uploads require a stable connection.
- **Transcription has many errors**: Review the audio quality tips above. The most common causes are background noise, the microphone being too far from the speaker, or multiple people speaking at the same time.
- **Quota exceeded — cannot start transcription**: Your monthly minutes have been used up. Wait for the quota to reset at the start of the next billing cycle, or ask your Admin to upgrade the plan for more minutes.
- **Recording paused accidentally**: If you hit Pause by mistake, just click Resume. The transcription continues from where it stopped. No audio is lost.

## Frequently Asked Questions

- **Can I transcribe a phone call?** You can if you record the call and then upload the audio file. TQ does not directly connect to phone lines.
- **What happens if my internet drops during live recording?** The live transcription requires a constant internet connection. If the connection drops, the recording may stop. Check your transcription and re-record the missing portion if needed.
- **Can I re-transcribe the same audio?** You can upload the same audio file to a new session to get a fresh transcription.
- **Does the quota reset automatically?** Yes. The quota resets at the beginning of each billing cycle (monthly) without any action needed from you.
- **How accurate is the transcription?** Accuracy depends on audio quality. With a good microphone in a quiet room, accuracy is typically above 90%. Editing the text afterward helps ensure the final documents are correct.
