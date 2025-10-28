# Background Jobs System

## Overview
The background jobs system runs automated maintenance tasks daily at night to optimize storage costs and maintain accurate transcription pricing data. Jobs are managed by node-cron and log their execution to the database for monitoring.

## Jobs

### 1. Audio Cleanup Job
**Schedule**: Daily at 2:00 AM (UTC)
**Job Name**: `audio_cleanup`
**Purpose**: Delete old audio files from Supabase storage to reduce storage costs

**What it does**:
- Queries all transcriptions older than 30 days
- Extracts audio file paths from database records
- Deletes corresponding files from Supabase storage buckets
- Logs statistics (deleted, failed counts)

**File**: `src/server/jobs/cleanupOldAudioFiles.js`

**Stats tracked**:
- `deleted`: Number of files successfully deleted
- `failed`: Number of files that failed to delete

**Cron expression**: `0 2 * * *` (2 AM daily)

### 2. Cost Update Job
**Schedule**: Daily at 3:00 AM (UTC)
**Job Name**: `cost_update`
**Purpose**: Fetch real transcription costs from Deepgram Management API and update database

**What it does**:
- Queries all transcriptions with `stt_provider_request_id` but no cost data
- Extracts Deepgram project ID from request_id format (`{project_id}.{unique_id}`)
- Calls Deepgram Management API to get actual costs
- Updates `audio_cost_usd` field in database
- Logs statistics (updated, unchanged, skipped, failed counts)

**File**: `src/server/jobs/updateTranscriptionCosts.js`

**Stats tracked**:
- `updated`: Number of records successfully updated with cost data
- `unchanged`: Number of records that already had cost data
- `skipped`: Number of records skipped (missing request_id or project_id)
- `failed`: Number of records that failed to update

**Cron expression**: `0 3 * * *` (3 AM daily)

**Environment variables**:
- `DEEPGRAM_API_KEY`: Deepgram service account API key (required)
- Project ID is extracted from `request_id` field (no separate env var needed)

## Database Schema

### Job Executions Table
Stores execution logs for all background jobs:

```sql
CREATE TABLE public.job_executions (
  id SERIAL PRIMARY KEY,
  job_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  stats JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX idx_job_executions_job_name ON job_executions(job_name);
CREATE INDEX idx_job_executions_status ON job_executions(status);
CREATE INDEX idx_job_executions_started_at ON job_executions(started_at DESC);
CREATE INDEX idx_job_executions_job_name_started_at ON job_executions(job_name, started_at DESC);
```

**Migration**: `src/server/infra/migrations/006_create_job_executions.sql`

## API Endpoints

### GET /internal/api/v1/jobs/status
Returns the latest execution status for each job.

**Response**:
```json
{
  "data": [
    {
      "job_name": "audio_cleanup",
      "status": "success",
      "started_at": "2025-10-28T02:00:15.234Z",
      "completed_at": "2025-10-28T02:01:45.678Z",
      "duration_ms": 90444,
      "stats": {
        "deleted": 45,
        "failed": 2
      },
      "error_message": null
    },
    {
      "job_name": "cost_update",
      "status": "success",
      "started_at": "2025-10-28T03:00:22.123Z",
      "completed_at": "2025-10-28T03:02:18.456Z",
      "duration_ms": 116333,
      "stats": {
        "updated": 120,
        "unchanged": 5,
        "skipped": 3,
        "failed": 1
      },
      "error_message": null
    }
  ]
}
```

**Usage**: Used by Internal Admin Dashboard to display job status cards.

## Dashboard Integration

### Background Jobs Section
The Internal Admin Dashboard (`/`) displays a "Background Jobs" section showing:

- Job name (Audio Cleanup, Cost Update)
- Current status (running, success, failed) with colored badges
- Last run timestamp
- Execution duration
- Detailed statistics grid
- Error messages (if failed)

**Features**:
- Real-time status loading with skeletons
- Color-coded status badges:
  - 🔵 Blue: Running (animated spinner)
  - 🟢 Green: Success (checkmark)
  - 🔴 Red: Failed (X icon)
- Empty state when no executions exist
- Responsive 2-column grid layout

**File**: `src/client/apps/internal-admin/features/dashboard/Dashboard.tsx`

## Implementation Details

### Job Execution Flow
1. **Start**: Job inserts record with `status='running'` and `started_at` timestamp
2. **Process**: Job performs its task (cleanup files or update costs)
3. **Complete**: Job updates record with:
   - `status='success'` or `status='failed'`
   - `completed_at` timestamp
   - `duration_ms` (calculated as `completed_at - started_at`)
   - `stats` JSONB object with job-specific metrics
   - `error_message` (if failed)

### Error Handling
- Jobs catch all errors and log them to `job_executions` table
- Failed jobs set `status='failed'` and store error message
- Jobs continue running on schedule even if previous execution failed
- Dashboard displays error messages for visibility

### Project ID Extraction (Cost Update)
Instead of requiring a separate `DEEPGRAM_PROJECT_ID` environment variable, the cost update job extracts the project ID from the `request_id` field:

```javascript
function extractProjectIdFromRequestId(requestId) {
  // request_id format: "{project_id}.{unique_id}"
  // Example: "abc123def456.7890xyz"
  const parts = requestId.split('.');
  return parts.length >= 2 ? parts[0] : null;
}
```

This avoids configuration issues and uses data already available in the database.

## Monitoring

### Log Output
Jobs log their progress to console:

```
[Job] Starting audio cleanup (scheduled: 0 2 * * *)
[Job] ✅ Audio cleanup completed: 45 deleted, 2 failed (90.4s)

[Job] Starting cost update (scheduled: 0 3 * * *)
[Job] ✅ Cost update completed: 120 updated, 5 unchanged, 3 skipped, 1 failed (116.3s)
```

### Database Monitoring
Query recent job executions:

```sql
-- Latest execution per job
SELECT DISTINCT ON (job_name)
  job_name, status, started_at, duration_ms, stats
FROM public.job_executions
ORDER BY job_name, started_at DESC;

-- Failed executions in last 7 days
SELECT job_name, started_at, error_message
FROM public.job_executions
WHERE status = 'failed'
  AND started_at >= NOW() - INTERVAL '7 days'
ORDER BY started_at DESC;
```

### Dashboard Monitoring
The Internal Admin Dashboard provides visual monitoring with automatic refresh on page load. Admins can quickly see:
- Whether jobs are running, succeeded, or failed
- How long jobs took to execute
- Detailed statistics for each job
- Any error messages that occurred

## Development

### Testing Jobs Locally
Jobs run automatically on schedule, but you can also test them manually:

```javascript
// In src/server/index.js or via node REPL
const { cleanupOldAudioFiles } = require('./jobs/cleanupOldAudioFiles');
const { updateTranscriptionCosts } = require('./jobs/updateTranscriptionCosts');

// Run manually (will log to database)
await cleanupOldAudioFiles();
await updateTranscriptionCosts();
```

### Adding a New Job
1. Create job file in `src/server/jobs/yourJob.js`
2. Implement job function with execution logging:
```javascript
async function yourJob() {
  const startTime = Date.now();
  let executionId = null;

  try {
    // Log start
    const result = await database.query(`
      INSERT INTO public.job_executions (job_name, status, started_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING id
    `, ['your_job', 'running']);
    executionId = result.rows[0].id;

    // Do work...
    const stats = { /* your stats */ };

    // Log success
    await database.query(`
      UPDATE public.job_executions
      SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, stats = $3
      WHERE id = $4
    `, ['success', Date.now() - startTime, JSON.stringify(stats), executionId]);

  } catch (error) {
    // Log failure
    if (executionId) {
      await database.query(`
        UPDATE public.job_executions
        SET status = $1, completed_at = CURRENT_TIMESTAMP, duration_ms = $2, error_message = $3
        WHERE id = $4
      `, ['failed', Date.now() - startTime, error.message, executionId]);
    }
  }
}
```
3. Schedule job in `src/server/index.js`:
```javascript
cron.schedule('0 4 * * *', yourJob); // 4 AM daily
```
4. Update Dashboard to display new job in UI

## Cost Optimization

### Why Daily Execution?
- **Minimize Cloud Costs**: Running jobs hourly (as initially configured) increases cloud compute costs unnecessarily
- **Night Schedule**: Jobs run at 2-3 AM UTC when traffic is lowest
- **Sequential Execution**: Cost update runs 1 hour after audio cleanup to spread load

### Storage Savings
The audio cleanup job can save significant storage costs:
- Average audio file: ~5-10 MB
- 1000 files/month: ~7.5 GB
- Monthly savings: ~$0.15-0.30 (depending on cloud provider)
- Annual savings: ~$1.80-3.60 per 1000 files

### API Call Optimization
The cost update job minimizes Deepgram API calls:
- Only fetches costs for records missing cost data
- Skips records without `request_id`
- Respects Deepgram API rate limits
- Runs once daily instead of on-demand

## Troubleshooting

### Job Not Running
1. Check cron schedule is registered in `src/server/index.js`
2. Verify server is running (jobs only run when server is up)
3. Check Railway logs for job output
4. Query `job_executions` table for recent executions

### Job Failing
1. Check `error_message` field in `job_executions` table
2. Review job-specific requirements:
   - Audio cleanup: Supabase credentials
   - Cost update: Deepgram API key
3. Check external service availability (Supabase, Deepgram)
4. Review Railway logs for detailed error stack traces

### Missing Job Data in Dashboard
1. Verify `/internal/api/v1/jobs/status` endpoint is accessible
2. Check browser console for API errors
3. Ensure jobs have run at least once (check `job_executions` table)
4. Refresh page to reload job data

## Future Improvements
- Email notifications for job failures
- Job retry logic with exponential backoff
- Configurable retention periods (30 days is hardcoded)
- Manual job triggering via API endpoint
- Job execution history view (last 30 days)
- Prometheus metrics export for monitoring
