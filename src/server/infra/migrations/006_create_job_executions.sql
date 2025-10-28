-- Migration: Create job_executions table for tracking background job runs
-- Description: Stores execution logs, status, and statistics for cron jobs (audio cleanup, cost updates)
-- Author: Claude
-- Date: 2025-01-28

-- Create job_executions table (global - not tenant-scoped)
CREATE TABLE IF NOT EXISTS public.job_executions (
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_executions_job_name ON public.job_executions(job_name);
CREATE INDEX IF NOT EXISTS idx_job_executions_status ON public.job_executions(status);
CREATE INDEX IF NOT EXISTS idx_job_executions_started_at ON public.job_executions(started_at DESC);

-- Create composite index for common queries (latest execution per job)
CREATE INDEX IF NOT EXISTS idx_job_executions_job_name_started_at
  ON public.job_executions(job_name, started_at DESC);

COMMENT ON TABLE public.job_executions IS 'Logs execution history of background cron jobs';
COMMENT ON COLUMN public.job_executions.job_name IS 'Name of the job (e.g., audio_cleanup, cost_update)';
COMMENT ON COLUMN public.job_executions.status IS 'Execution status: running, success, or failed';
COMMENT ON COLUMN public.job_executions.stats IS 'JSON statistics (e.g., {deleted: 5, failed: 0, updated: 12})';
COMMENT ON COLUMN public.job_executions.duration_ms IS 'Execution duration in milliseconds';
