Deepgram Pre‑Recorded Audio & Token‑Based Authentication
Overview
Deepgram’s speech‑to‑text service offers two main ways to send audio for transcription: pre‑recorded requests (batch) and streaming. For our SaaS, which needs to transcribe 30–60 minute .webm files recorded during dental consultations, the batch (pre‑recorded) API is simpler and allows us to process up to 100 concurrent requests per project[1]. Deepgram also supports temporary JWT tokens that provide short‑lived authorization for client‑side applications[2]; these are optional for batch processing but will be useful when we implement real‑time streaming in the future. The sections below summarize how to use Deepgram’s pre‑recorded audio API and how token‑based authentication works.
Pre‑Recorded Audio API
Getting started
To transcribe pre‑recorded audio, you send a POST request to the /v1/listen endpoint with your audio file. There are two ways to send audio:
Remote file – Provide Deepgram with a URL pointing to your audio. This is recommended for long files; set Content‑Type: application/json and include a body like { "url": "https://example.com/audio.webm" }[3]. You authenticate using an API key in the Authorization header (Token YOUR_API_KEY). The query parameters can include model=nova-3 to choose a specific model and smart_format=true for improved punctuation[3].
Local file upload – For smaller files you can stream binary data directly. Set Content‑Type to your file’s MIME type (e.g., audio/wav) and use --data-binary @yourfile.wav with curl[3]. The same authorization header applies.
Deepgram provides SDKs for JavaScript, Python, C# and Go that wrap these calls. Regardless of method, the API returns JSON containing a transcript, confidence score and per‑word timestamps[4]. Deepgram does not store transcripts, so you must save the response or supply a callback URL to receive results asynchronously[5].
Limits and performance
When using the pre‑recorded API, keep the following limits in mind:
File size – Individual audio files may not exceed 2 GB. For large video files, extract the audio stream and upload only the audio to reduce size[1].
Concurrent requests – Projects using Nova, Base or Enhanced models can issue up to 100 concurrent pre‑recorded requests. The Whisper model allows 15 concurrent requests on paid plans and 5 on pay‑as‑you‑go plans[1]. Exceeding these limits returns a 429 “Too Many Requests” error.
Processing time – Fast models (Nova, Base, Enhanced) have a maximum processing time of 10 minutes; the Whisper model’s limit is 20 minutes. Requests exceeding these durations are canceled and return a 504 Gateway Timeout[6]. In practice, an hour‑long 50 MB file usually transcribes in 20–60 seconds, so our use case fits well within these limits.
Rate limits – Deepgram enforces global API rate limits per account. The concurrency limits above cover batch processing; for detailed rate‑limit policies refer to Deepgram’s documentation.
Best practices for batch transcription
Prepare your audio – Use supported formats like WebM, WAV or MP3; audio must be mono or stereo. Extract audio from video files to keep sizes small[1].
Choose the right model – Use model=nova-3 or another model that suits your domain. You can omit the parameter to let Deepgram choose the default (currently general‑base). Enabling smart_format=true improves formatting of numbers, phone numbers and currency[3].
Save transcripts or use callbacks – Because Deepgram does not persist transcripts, send a callback query parameter in your request to have the transcript delivered to your backend asynchronously. This is important for long files where polling may time out[5].
Monitor usage – Log request identifiers and durations to measure cost and performance. Include a request ID in your application logs; this ID appears in the metadata field of the response[4].
Token‑Based Authentication
Overview
Deepgram supports token‑based authentication by issuing short‑lived JSON Web Tokens (JWTs). A temporary token is a secure credential that grants time‑limited access to Deepgram APIs[2]. By default, tokens have a 30‑second time‑to‑live (TTL), making them ideal for client‑side or untrusted environments where storing a long‑lived API key is undesirable[2]. Tokens are especially useful for realtime WebSocket connections, since the token only needs to be valid during the initial connection handshake[7].
Obtaining and using a token
Generate the token – From your backend, send a POST request to /v1/auth/grant with your API key in the Authorization header (Token YOUR_API_KEY). Deepgram returns a JSON object containing access_token and expires_in (the TTL in seconds)[8]. You can optionally set a custom TTL by including ttl_seconds: <value> in the request body; the maximum supported TTL is 3 600 seconds (1 hour)[7].
Pass the token to the client – Return the JWT to the browser or mobile app that needs to call Deepgram.
Call the API – When making a Deepgram request from the client, include the token using the Authorization: Bearer <JWT_TOKEN> header[9]. Tokens can be used with the /listen and /speak REST and WebSocket APIs, the /read text‑intelligence API and the /agent voice‑agent WebSocket API[7]. Management APIs do not accept temporary tokens.
Implementation considerations
Deepgram’s guidelines recommend the following when implementing token‑based auth[10]:
Create a backend service to generate tokens. Never expose your API key in client code.
Generate tokens only when needed, for example at the start of a streaming session.
Pass the token to the client and start the Deepgram request immediately. Tokens expire quickly, so delays may cause authorization errors.
Handle expiration – If a token expires, your client should request a new one from your backend.
Use tokens judiciously – For pre‑recorded (batch) requests, the short TTL means you’ll usually call Deepgram from your backend. Client‑side tokens are more useful for real‑time streaming and low‑latency applications[11].
FAQs and tips
Longer TTL – You can request a longer TTL up to 3 600 seconds by adding ttl_seconds in the auth/grant request. However, for security reasons, it’s best to keep TTLs short[7].
WebSocket duration – A WebSocket connection can continue beyond the token’s expiry; the token only needs to be valid during the initial handshake[7].
Pre‑recorded requests – You can use temporary tokens to transcribe pre‑recorded audio, but you must obtain a new token before each request due to the short TTL. For batch jobs it’s usually simpler and safer to make requests from your backend using the API key[11].
SDK support – Deepgram’s client SDKs support token‑based authentication; refer to the SDK documentation for language‑specific usage[11].
Usage tracking – Temporary tokens inherit the same accessor as the API key used to create them. This means you can track usage on a per‑client basis in your own system[12].
Advantages over API keys – Tokens reduce disruption because they are more resilient to outages and prevent the Deepgram console from becoming cluttered with many one‑off keys. They also provide faster connection times for WebSocket use cases and keep your API keys hidden[11].
Applying this to our SaaS
For our audio‑transcription SaaS, the batch (pre‑recorded) API fits our requirements perfectly:
Our .webm files (~50 MB, 30–60 minutes) are well under the 2 GB file‑size limit[1]. Deepgram’s Nova and Base models can handle up to 100 concurrent requests, which is sufficient for the expected usage[1].
We will upload each recording to our storage (e.g., S3/Supabase), generate a signed URL, and call the /v1/listen endpoint from our backend using the API key. We’ll set smart_format=true and optionally choose a specific model. To avoid timeouts, we’ll provide a callback URL so Deepgram can deliver results asynchronously[5].
The API generally returns transcripts within tens of seconds, far below the 10‑minute processing window[6]. We will store the transcript, confidence and word‑timings in our database and update the session status accordingly.
Because batch requests originate from our backend, token‑based auth is not required for this phase. We will implement token issuance later for streaming (Phase 2), following Deepgram’s guidelines to generate tokens on demand, pass them to clients and handle expirations[10].
By following these guidelines, we can confidently integrate Deepgram’s pre‑recorded audio API into our multi‑tenant SaaS while preparing the groundwork for real‑time streaming support.

[1] [3] [4] [5] [6] Getting Started | Deepgram's Docs
https://developers.deepgram.com/docs/pre-recorded-audio
[2] [7] [8] [9] [10] [11] [12] Token-Based Auth | Deepgram's Docs
https://developers.deepgram.com/guides/fundamentals/token-based-authentication