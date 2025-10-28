import { api } from '@client/config/http'

export interface JobExecution {
  job_name: string
  status: 'running' | 'success' | 'failed'
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  stats: {
    deleted?: number
    failed?: number
    updated?: number
    unchanged?: number
    skipped?: number
  }
  error_message: string | null
}

export interface JobsStatusResponse {
  data: JobExecution[]
}

class JobsService {
  async getStatus(): Promise<JobExecution[]> {
    const response = await api.get<JobsStatusResponse>('/internal/api/v1/jobs/status')
    return response.data.data
  }

  async getHistory(limit = 20): Promise<JobExecution[]> {
    const response = await api.get<{ data: JobExecution[] }>(`/internal/api/v1/jobs/history?limit=${limit}`)
    return response.data.data
  }
}

export const jobsService = new JobsService()
