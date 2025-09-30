# TQ (Transcription & Quote) API Documentation

## Overview

The TQ API provides comprehensive audio transcription capabilities for medical consultations, integrated with Deepgram AI transcription services and Supabase Storage for secure file management.

**Base URL:** `http://localhost:3004/api/tq/v1`
**Authentication:** Bearer token + x-tenant-id header
**Multi-tenancy:** All operations are tenant-scoped

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   TQ Client │    │  TQ API     │    │  Supabase   │    │  Deepgram   │
│ (Port 3005) │    │ (Port 3004) │    │   Storage   │    │     AI      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Upload Audio   │                   │                   │
       ├──────────────────►│                   │                   │
       │                   │ 2. Store File     │                   │
       │                   ├──────────────────►│                   │
       │                   │ 3. Signed URL     │                   │
       │                   │◄──────────────────┤                   │
       │                   │ 4. Start Transcription                │
       │                   ├───────────────────────────────────────►│
       │                   │ 5. Request ID     │                   │
       │                   │◄───────────────────────────────────────┤
       │ 6. Processing...  │                   │                   │
       │◄──────────────────┤                   │                   │
       │                   │        7. Webhook Callback            │
       │                   │◄───────────────────────────────────────┤
       │ 8. Complete       │                   │                   │
       │◄──────────────────┤                   │                   │
```

## Core Resources

### Transcriptions

Manage audio transcription lifecycle independent of sessions.

#### POST /transcriptions/upload
Upload audio file for transcription.

**Request:**
```http
POST /api/tq/v1/transcriptions/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}
x-tenant-id: {numeric_tenant_id}

Content-Disposition: form-data; name="audio"; filename="recording.mp3"
Content-Type: audio/mpeg

{binary_audio_data}
```

**Response:**
```json
{
  "success": true,
  "transcriptionId": "uuid-string",
  "audioUrl": "https://supabase.storage.url/tenant_2/uuid.mp3",
  "fileName": "recording.mp3",
  "fileSize": 15728640,
  "status": "uploaded"
}
```

**Supported Formats:**
- `.webm` (preferred for web recordings)
- `.mp3` (compressed audio)
- `.mp4` (audio/video)
- `.wav` (uncompressed audio)

**File Limits:**
- Maximum size: 100MB
- Recommended duration: 30-120 minutes

#### POST /transcriptions/{transcriptionId}/transcribe
Start Deepgram transcription process.

**Request:**
```http
POST /api/tq/v1/transcriptions/{transcriptionId}/transcribe
Authorization: Bearer {token}
x-tenant-id: {numeric_tenant_id}
Content-Type: application/json

{}
```

**Response:**
```json
{
  "success": true,
  "transcriptionId": "uuid-string",
  "requestId": "deepgram-request-id",
  "status": "processing",
  "estimatedProcessingTime": 1800
}
```

#### GET /transcriptions/{transcriptionId}/status
Check transcription status and retrieve results.

**Request:**
```http
GET /api/tq/v1/transcriptions/{transcriptionId}/status
Authorization: Bearer {token}
x-tenant-id: {numeric_tenant_id}
```

**Response:**
```json
{
  "transcriptionId": "uuid-string",
  "status": "completed",
  "transcript": "Patient reported symptoms of...",
  "confidenceScore": 0.94,
  "requestId": "deepgram-request-id",
  "processingDuration": 45.2,
  "hasAudio": true,
  "createdAt": "2025-09-25T04:00:00Z",
  "updatedAt": "2025-09-25T04:02:15Z"
}
```

**Status Values:**
- `created`: Initial state
- `uploading`: File being uploaded
- `uploaded`: Ready for transcription
- `processing`: Deepgram is processing
- `completed`: Transcription finished
- `failed`: Error occurred

### Sessions

Manage patient consultation sessions.

#### POST /sessions
Create new consultation session.

**Request:**
```json
{
  "patientId": "uuid-string",
  "transcription": "Initial consultation notes..."
}
```

#### GET /sessions/{sessionId}
Retrieve session details.

#### PUT /sessions/{sessionId}
Update session information.

### Patients

Manage patient records for consultations.

#### GET /patients?search={query}&limit={number}
Search patients by name or email.

#### POST /patients
Create new patient record.

#### GET /patients/{patientId}
Retrieve patient details.

### AI Agent

Generate intelligent medical summaries from transcriptions using OpenAI.

#### POST /ai-agent/chat
Send messages to AI Agent for creating medical summaries.

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Below I'm sending a consultation transcription. Create a clear and comprehensive treatment summary..."
    },
    {
      "role": "assistant",
      "content": "Patient Name: John Doe\nDate of Visit: September 27, 2025..."
    },
    {
      "role": "user",
      "content": "Please add a section about follow-up care"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "response": "Patient Name: John Doe\nDate of Visit: September 27, 2025\n\n## Treatment Summary\nDuring your consultation today...\n\n## Follow-up Care\nPlease schedule a follow-up appointment in 2 weeks..."
  },
  "meta": {
    "code": "AI_RESPONSE_GENERATED",
    "message": "AI response generated successfully"
  }
}
```

**Features:**
- **Interactive Chat**: Users can iterate and refine summaries
- **Medical Focus**: Optimized prompts for dental/medical summaries
- **Template-Based**: Structured output format for consistency
- **Integration**: Direct quote creation from AI summaries

### Quotes

Manage consultation quotes and pricing for services.

#### GET /quotes
List all quotes for the tenant.

**Query Parameters:**
- `sessionId` (UUID): Filter quotes by session
- `status` (enum): Filter by quote status (draft, sent, approved, rejected, expired)
- `includeSession` (boolean): Include session details in response
- `limit` (integer): Maximum results per page (default: 50)
- `offset` (integer): Pagination offset (default: 0)

#### GET /quotes/{quoteId}
Retrieve quote details.

**Query Parameters:**
- `includeItems` (boolean): Include quote items in response
- `includeSession` (boolean): Include session details in response

#### POST /quotes
Create new quote for a session.

**Request:**
```json
{
  "sessionId": "uuid-string",
  "content": "Initial quote for consultation services",
  "status": "draft"
}
```

#### PUT /quotes/{quoteId}
Update quote information.

**Request:**
```json
{
  "content": "Updated quote description",
  "total": 150.00,
  "status": "sent"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid-string",
    "number": "QUO000001",
    "sessionId": "uuid-string",
    "content": "Updated quote description",
    "total": 150.00,
    "status": "sent",
    "createdAt": "2025-09-29T10:00:00Z",
    "updatedAt": "2025-09-29T10:30:00Z",
    "patient_first_name": "John",
    "patient_last_name": "Doe",
    "session_number": "SES000001"
  },
  "meta": {
    "code": "QUOTE_UPDATED",
    "message": "Quote updated successfully"
  }
}
```

**Note:** The `meta.code` triggers automatic success feedback toast in the frontend via HTTP interceptor.

#### DELETE /quotes/{quoteId}
Delete a quote.

### Quote Items

Manage individual services/products within quotes.

#### GET /quotes/{quoteId}/items
List all items for a quote.

#### POST /quotes/{quoteId}/items
Add new item to quote.

**Request:**
```json
{
  "name": "Initial Consultation",
  "description": "60-minute initial patient consultation",
  "basePrice": 200.00,
  "discountAmount": 20.00,
  "quantity": 1
}
```

**Note:** `finalPrice` is automatically calculated as `(basePrice - discountAmount) × quantity`

#### PUT /quotes/{quoteId}/items/{itemId}
Update quote item.

**Request:**
```json
{
  "name": "Extended Consultation",
  "basePrice": 250.00,
  "discountAmount": 25.00,
  "quantity": 1
}
```

#### DELETE /quotes/{quoteId}/items/{itemId}
Remove item from quote.

#### POST /quotes/{quoteId}/calculate
Recalculate quote total based on all items.

**Response:**
```json
{
  "total": 425.00
}
```

### Clinical Reports

Manage clinical reports for patient sessions with AI-powered content generation.

#### GET /clinical-reports
List all clinical reports with optional filtering and pagination.

**Query Parameters:**
- `limit` (integer): Number of reports to return (default: 50)
- `offset` (integer): Number of reports to skip (default: 0)
- `sessionId` (UUID): Filter by session ID

**Response:**
```json
{
  "data": [
    {
      "id": "uuid-string",
      "number": "CLR000001",
      "session_id": "uuid-string",
      "content": "<p>Clinical report content...</p>",
      "created_at": "2025-09-30T10:00:00Z",
      "updated_at": "2025-09-30T10:00:00Z",
      "session_number": "SES000001",
      "session_status": "completed",
      "patient_id": "uuid-string",
      "patient_first_name": "John",
      "patient_last_name": "Doe",
      "patient_email": "john@example.com",
      "patient_phone": "+1234567890"
    }
  ],
  "meta": {
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /clinical-reports/{reportId}
Retrieve a specific clinical report by ID.

**Response:**
```json
{
  "data": {
    "id": "uuid-string",
    "number": "CLR000001",
    "session_id": "uuid-string",
    "content": "<p>Clinical report content...</p>",
    "created_at": "2025-09-30T10:00:00Z",
    "updated_at": "2025-09-30T10:00:00Z",
    "session_number": "SES000001",
    "patient_first_name": "John",
    "patient_last_name": "Doe"
  }
}
```

#### POST /clinical-reports
Create a new clinical report for a session.

**Request:**
```json
{
  "sessionId": "uuid-string",
  "content": "<p>Clinical report content filled by AI...</p>"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid-string",
    "number": "CLR000001",
    "session_id": "uuid-string",
    "content": "<p>Clinical report content...</p>",
    "created_at": "2025-09-30T10:00:00Z",
    "updated_at": "2025-09-30T10:00:00Z"
  },
  "meta": {
    "code": "CLINICAL_REPORT_CREATED",
    "message": "Clinical report created successfully"
  }
}
```

#### PUT /clinical-reports/{reportId}
Update clinical report content.

**Request:**
```json
{
  "content": "<p>Updated clinical report content...</p>"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid-string",
    "number": "CLR000001",
    "content": "<p>Updated content...</p>",
    "updated_at": "2025-09-30T11:00:00Z"
  },
  "meta": {
    "code": "CLINICAL_REPORT_UPDATED",
    "message": "Clinical report updated successfully"
  }
}
```

#### DELETE /clinical-reports/{reportId}
Delete a clinical report.

### Templates

Clinical documentation templates for AI-powered note generation.

#### GET /templates
List all templates with optional filtering and pagination.

**Query Parameters:**
- `limit` (integer): Number of templates to return (default: 50)
- `offset` (integer): Number of templates to skip (default: 0)
- `active` (boolean): Filter by active status
- `search` (string): Search in title and description

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```

#### GET /templates/{templateId}
Retrieve a specific template by ID.

#### POST /templates
Create a new template.

**Request Body:**
```json
{
  "title": "Dental Consultation Summary",
  "content": "Patient $patient.name$ visited on $date.session$ for [reason for visit]. Clinical findings: [examination results]. (Only include if mentioned in transcript)",
  "description": "Standard template for dental consultations",
  "active": true
}
```

#### PUT /templates/{templateId}
Update an existing template.

#### DELETE /templates/{templateId}
Soft delete a template (sets active to false).

#### GET /templates/most-used
Get templates ordered by usage count.

**Query Parameters:**
- `limit` (integer): Number of templates to return (default: 10)

#### POST /templates/{templateId}/increment-usage
Increment the usage count for a template (called by AI agent).

## Integration Details

### Deepgram AI Transcription

The TQ API integrates with Deepgram for high-quality medical transcription.

#### Configuration
```bash
# Environment Variables
DEEPGRAM_API_KEY=your-deepgram-api-key
DEEPGRAM_WEBHOOK_SECRET=webhook-secret-for-validation
API_BASE_URL=http://localhost:3004  # For webhook callbacks

# OpenAI Configuration for AI Agent
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

#### Transcription Features
- **Model**: Nova-2 (latest Deepgram model)
- **Smart Formatting**: Automatic punctuation and capitalization
- **Medical Accuracy**: Optimized for medical terminology
- **Confidence Scoring**: Per-transcription confidence metrics
- **Word Timestamps**: Precise timing for each word (stored for future features)

#### Webhook Processing
Deepgram delivers results via webhook callback:

```http
POST /api/tq/v1/transcriptions/webhook/deepgram
x-deepgram-signature: {hmac_signature}
Content-Type: application/json

{
  "request_id": "deepgram-request-id",
  "metadata": {
    "callback_metadata": "{\"transcriptionId\":\"uuid\",\"tenantId\":\"2\"}"
  },
  "results": {
    "channels": [{
      "alternatives": [{
        "transcript": "Patient presented with...",
        "confidence": 0.94,
        "words": [...]
      }]
    }]
  }
}
```

#### Error Handling
Common Deepgram errors and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| `REMOTE_CONTENT_ERROR` | Audio file not accessible | Check Supabase signed URL |
| `Invalid callback URL` | Webhook URL unreachable | Use ngrok or deploy webhook |
| `INVALID_MODEL` | Model not supported | Use supported model (nova-2) |
| `FILE_TOO_LARGE` | File exceeds limits | Compress or split audio |

### Supabase Storage

Secure file storage for audio files with tenant isolation.

#### Configuration
```bash
# Environment Variables
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=tq-audio-files
SUPABASE_STORAGE_PUBLIC_URL=https://your-project.supabase.co/storage/v1/s3
```

#### Storage Structure
```
tq-audio-files/
├── tenant_1/
│   ├── {transcription-uuid-1}.mp3
│   └── {transcription-uuid-2}.webm
├── tenant_2/
│   ├── {transcription-uuid-3}.wav
│   └── {transcription-uuid-4}.mp4
└── tenant_n/
    └── ...
```

#### URL Generation
For external API access (like Deepgram):
- **Signed URLs**: 24-hour expiry for external services
- **Public URLs**: For internal application access
- **Security**: Automatic tenant isolation in file paths

#### File Management
```javascript
// Upload with automatic URL generation
const result = await supabaseService.uploadAudioFile(
  fileBuffer,
  'recording.mp3',
  transcriptionId,
  tenantId,
  'audio/mpeg'
);

// Returns:
// {
//   url: 'signed-url-for-deepgram',
//   publicUrl: 'public-url-for-app',
//   signedUrl: 'signed-url-24h-expiry',
//   path: 'tenant_2/uuid.mp3',
//   size: 15728640
// }
```

## Database Schema

### Transcription Table
```sql
-- Per-tenant transcription table
CREATE TABLE tenant_{slug}.transcription (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_status VARCHAR(20) DEFAULT 'created',
  transcript TEXT NULL,
  confidence_score DECIMAL(4,3) NULL,
  audio_url TEXT NULL,
  deepgram_request_id TEXT NULL,
  processing_duration_seconds INTEGER NULL,
  word_timestamps JSONB NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Session Table
```sql
-- Per-tenant session table
CREATE TABLE tenant_{slug}.session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id_fk UUID NOT NULL REFERENCES tenant_{slug}.patient(id),
  transcription TEXT NULL,
  session_status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Patient Table
```sql
-- Per-tenant patient table
CREATE TABLE tenant_{slug}.patient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NULL,
  last_name VARCHAR(100) NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Quote Table
```sql
-- Per-tenant quote table
CREATE TABLE tenant_{slug}.quote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(10) NOT NULL UNIQUE DEFAULT ('QUO' || LPAD(nextval('quote_number_seq')::text, 6, '0')),
  session_id UUID NOT NULL REFERENCES tenant_{slug}.session(id) ON DELETE CASCADE,
  content TEXT NULL,
  total NUMERIC(12,2) DEFAULT 0.00,
  status quote_status_enum NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Quote number sequence
CREATE SEQUENCE quote_number_seq START WITH 1 INCREMENT BY 1;

-- Quote status enum
CREATE TYPE quote_status_enum AS ENUM ('draft','sent','approved','rejected','expired');
```

### Quote Item Table
```sql
-- Per-tenant quote_item table
CREATE TABLE tenant_{slug}.quote_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES tenant_{slug}.quote(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0.00,
  final_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Template Table
```sql
-- Per-tenant template table for AI-powered clinical documentation
CREATE TABLE tenant_{slug}.template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX template_active_idx ON tenant_{slug}.template(active);
CREATE INDEX template_usage_count_idx ON tenant_{slug}.template(usage_count DESC);
CREATE INDEX template_title_idx ON tenant_{slug}.template(title);

-- Full-text search index
CREATE INDEX template_search_idx ON tenant_{slug}.template
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Auto-update timestamp trigger
CREATE TRIGGER template_updated_at_trigger
    BEFORE UPDATE ON tenant_{slug}.template
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Clinical Report Table
```sql
-- Per-tenant clinical_report table for medical documentation
CREATE TABLE tenant_{slug}.clinical_report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(10) NOT NULL UNIQUE DEFAULT ('CLR' || LPAD(nextval('clinical_report_number_seq')::text, 6, '0')),
  session_id UUID NOT NULL REFERENCES tenant_{slug}.session(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Clinical report number sequence
CREATE SEQUENCE clinical_report_number_seq START WITH 1 INCREMENT BY 1;

-- Indexes for performance
CREATE INDEX clinical_report_session_idx ON tenant_{slug}.clinical_report(session_id);
CREATE INDEX clinical_report_created_at_idx ON tenant_{slug}.clinical_report(created_at DESC);

-- Auto-update timestamp trigger
CREATE TRIGGER clinical_report_updated_at_trigger
    BEFORE UPDATE ON tenant_{slug}.clinical_report
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Complete Workflow Example

### Quote Creation Workflow
```javascript
// 1. Create quote for a session
const quote = await fetch('/api/tq/v1/quotes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-tenant-id': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: sessionId,
    content: 'Quote for consultation services',
    status: 'draft'
  })
}).then(res => res.json());

// 2. Add services/items to quote
const items = [
  {
    name: 'Initial Consultation',
    description: '60-minute consultation',
    basePrice: 200.00,
    discountAmount: 20.00,
    quantity: 1
  },
  {
    name: 'Follow-up Session',
    description: '30-minute follow-up',
    basePrice: 100.00,
    discountAmount: 0.00,
    quantity: 2
  }
];

for (const item of items) {
  await fetch(`/api/tq/v1/quotes/${quote.id}/items`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'x-tenant-id': tenantId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  });
}

// 3. Calculate final total (automatic)
const finalQuote = await fetch(`/api/tq/v1/quotes/${quote.id}?includeItems=true`, {
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-tenant-id': tenantId
  }
}).then(res => res.json());

console.log(`Quote total: $${finalQuote.total}`); // $380.00
console.log(`Items: ${finalQuote.items.length}`); // 2 items

// 4. Update quote status when ready to send
await fetch(`/api/tq/v1/quotes/${quote.id}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-tenant-id': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'sent'
  })
});
```

### AI Agent Medical Summary Workflow
```javascript
// 1. Generate initial medical summary from transcription
const messages = [
  {
    role: 'user',
    content: `Below I'm sending a consultation transcription. Create a clear and comprehensive treatment summary written directly for the patient.

Rules:
• Write in 2nd person not 3rd person
• Use only what is explicitly stated in the transcript. Do not invent, assume, or infer anything.
• Do not include anything related to prices or costs.
• Begin the summary with:
Patient Name: ${patientName}
Date of Visit: ${currentDate}
• Structure the summary in clear sections

Here is the transcription:
${transcriptionText}`
  }
];

const response = await fetch('/api/tq/v1/ai-agent/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-tenant-id': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ messages })
});

const result = await response.json();
const aiSummary = result.data.response;

// 2. User can iterate and refine the summary
const refinedMessages = [
  ...messages,
  { role: 'assistant', content: aiSummary },
  { role: 'user', content: 'Please add a section about post-treatment care instructions' }
];

const refinedResponse = await fetch('/api/tq/v1/ai-agent/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-tenant-id': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ messages: refinedMessages })
});

// 3. Create quote with AI-generated summary
const quote = await fetch('/api/tq/v1/quotes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-tenant-id': tenantId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionId: sessionId,
    content: aiSummary, // AI-generated summary, not original transcription
    status: 'draft'
  })
});
```

### Frontend Upload Process
```javascript
// 1. Upload audio file
const uploadResult = await transcriptionService.processAudio(audioFile, {
  onUploadComplete: (transcriptionId) => {
    // File uploaded to Supabase
    updateProgress('Upload complete');
  },

  onTranscriptionStarted: (transcriptionId) => {
    // Deepgram processing started
    updateProgress('Transcription started');
  },

  onProgress: (statusResponse) => {
    // Polling status updates
    if (statusResponse.status === 'completed') {
      displayTranscript(statusResponse.transcript);
    }
  }
});
```

### Backend Processing Flow
```javascript
// 1. Upload to Supabase Storage
const uploadResult = await supabaseService.uploadAudioFile(/*...*/);
// Returns signed URL accessible by Deepgram

// 2. Start Deepgram transcription
const transcriptionResult = await deepgramService.transcribeByUrl(
  uploadResult.signedUrl,
  webhookCallbackUrl,
  { model: 'nova-2' }
);
// Returns request_id for tracking

// 3. Update database status
await db.query(`
  UPDATE tenant_${tenantId}.transcription
  SET deepgram_request_id = $1, transcript_status = 'processing'
  WHERE id = $2
`, [transcriptionResult.request_id, transcriptionId]);

// 4. Webhook receives result (automatic)
// 5. Database updated with transcript (automatic)
```

## Automatic Feedback System

All TQ API mutation endpoints (POST, PUT, PATCH, DELETE) return standardized responses with `meta.code` that trigger automatic success feedback toasts in the frontend.

### Backend Response Format

**Standard Success Response:**
```json
{
  "data": { /* entity data */ },
  "meta": {
    "code": "OPERATION_CODE",  // Must be in FEEDBACK_CATALOG
    "message": "Operation completed successfully"  // Fallback message
  }
}
```

### Supported Feedback Codes

| Code | Title | Message |
|------|-------|---------|
| `QUOTE_CREATED` | Quote Created | Quote created successfully. |
| `QUOTE_UPDATED` | Quote Updated | Quote updated successfully. |
| `QUOTE_DELETED` | Quote Deleted | Quote deleted successfully. |
| `SESSION_CREATED` | Session Created | Session created successfully. |
| `SESSION_UPDATED` | Session Updated | Session updated successfully. |
| `PATIENT_CREATED` | Patient Created | Patient created successfully. |
| `PATIENT_UPDATED` | Patient Updated | Patient updated successfully. |
| `TEMPLATE_CREATED` | Template Created | Template created successfully. |
| `TEMPLATE_UPDATED` | Template Updated | Template updated successfully. |
| `TEMPLATE_FILLED` | Template Filled | Template filled successfully with AI. |
| `CLINICAL_REPORT_CREATED` | Clinical Report Created | Clinical report created successfully. |
| `CLINICAL_REPORT_UPDATED` | Clinical Report Updated | Clinical report updated successfully. |
| `CLINICAL_REPORT_DELETED` | Clinical Report Deleted | Clinical report deleted successfully. |

### How It Works

1. **Backend**: Returns `meta.code` in response
2. **HTTP Interceptor** (`src/client/config/http.ts`): Detects mutative method + `meta.code`
3. **Feedback Catalog** (`src/client/common/feedback/catalog.ts`): Maps code to title/message
4. **Toast Notification**: Appears automatically - no manual `publishFeedback()` needed

### Frontend Implementation

**❌ Wrong - Manual feedback:**
```typescript
const handleSave = async () => {
  await quotesService.updateQuote(id, data)
  publishFeedback({ kind: 'success', message: 'Saved!' })  // DON'T DO THIS
}
```

**✅ Correct - Automatic feedback:**
```typescript
const handleSave = async () => {
  const updated = await quotesService.updateQuote(id, data)
  setQuote(updated)  // Just update local state
  // Success feedback is handled automatically by HTTP interceptor
}
```

### Quote Edit Page Behavior

The quote edit page (`/quotes/:id/edit`) follows best practices:
- ✅ Stays on page after save (doesn't navigate away)
- ✅ Updates local state with server response
- ✅ Shows automatic success feedback toast
- ✅ Allows continued editing or manual navigation via "Cancel"

## Production Considerations

### Security
- **Webhook Validation**: HMAC signature verification for Deepgram callbacks
- **File Access**: Signed URLs with limited expiry for external services
- **Tenant Isolation**: All data stored with tenant prefixes
- **Authentication**: JWT + tenant header required for all endpoints

### Performance
- **Async Processing**: Non-blocking transcription workflow
- **File Limits**: 100MB upload limit with pre-validation
- **Connection Pooling**: Database connections managed efficiently
- **Storage Optimization**: Automatic file type validation and compression

### Monitoring
- **Request Tracking**: All Deepgram requests logged with IDs
- **Error Handling**: Comprehensive error responses with request context
- **Status Polling**: Frontend can poll for transcription completion
- **Webhook Reliability**: Automatic retry logic for failed webhooks

### Deployment
- **Webhook URL**: Must be publicly accessible (use ngrok for development)
- **Environment Variables**: All secrets properly configured
- **Database Migrations**: Tenant schemas created automatically
- **File Storage**: Supabase bucket configured with proper permissions

## API Testing

### Using curl
```bash
# Upload audio file
curl -X POST http://localhost:3004/api/tq/v1/transcriptions/upload \
  -H "Authorization: Bearer your-jwt-token" \
  -H "x-tenant-id: 2" \
  -F "audio=@recording.mp3"

# Start transcription
curl -X POST http://localhost:3004/api/tq/v1/transcriptions/{id}/transcribe \
  -H "Authorization: Bearer your-jwt-token" \
  -H "x-tenant-id: 2" \
  -H "Content-Type: application/json" \
  -d "{}"

# Check status
curl -X GET http://localhost:3004/api/tq/v1/transcriptions/{id}/status \
  -H "Authorization: Bearer your-jwt-token" \
  -H "x-tenant-id: 2"
```

### Swagger Documentation
Interactive API documentation available at:
`http://localhost:3004/docs`

---

**Note**: This documentation reflects the current development setup. For production deployment, webhook URLs must be publicly accessible and all environment variables properly configured.