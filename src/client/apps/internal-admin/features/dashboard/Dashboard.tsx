import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardContent, Skeleton, Alert, Button, EmptyState } from '@client/common/ui'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Users, Building, Package, Activity, BookOpen, Clock, CheckCircle, XCircle, Loader } from 'lucide-react'
import { metricsService, PlatformMetrics } from '../../services/metrics'
import { jobsService, JobExecution } from '../../services/jobs'

const MetricCard: React.FC<{
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange'
}> = ({ title, value, subtitle, trend, icon, color = 'blue' }) => {
  const trendIcon = {
    up: <TrendingUp className="h-4 w-4 text-green-600" />,
    down: <TrendingDown className="h-4 w-4 text-red-600" />,
    stable: <Minus className="h-4 w-4 text-gray-600" />
  }

  const colorVariants = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="relative overflow-hidden border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                {icon && (
                  <div className={`p-2.5 rounded-lg border ${colorVariants[color]}`}>
                    {icon}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                  {trend && (
                    <div className="flex items-center gap-1">
                      {trendIcon[trend]}
                      <span className={`text-xs font-medium ${
                        trend === 'up' ? 'text-green-600' : 
                        trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {trend === 'up' ? 'Trending up' : trend === 'down' ? 'Trending down' : 'Stable'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<JobExecution[]>([])
  const [jobsLoading, setJobsLoading] = useState(true)

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 [Dashboard] Fetching platform metrics...')

      const data = await metricsService.getPlatformOverview()
      setMetrics(data)
      console.log('✅ [Dashboard] Metrics loaded:', data)

    } catch (err: any) {
      console.error('❌ [Dashboard] Failed to load metrics:', err)
      setError(err.message || 'Failed to load metrics')
    } finally {
      setLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      setJobsLoading(true)
      const data = await jobsService.getStatus()
      setJobs(data)
    } catch (err: any) {
      console.error('❌ [Dashboard] Failed to load jobs:', err)
    } finally {
      setJobsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    fetchJobs()
  }, [])

  const getTrend = (newThisWeek: number, newThisMonth: number): 'up' | 'down' | 'stable' => {
    if (newThisWeek > 0 || newThisMonth > 0) return 'up'
    return 'stable'
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="border-b border-gray-200/50 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-600 mt-2 text-lg">
              Platform overview and key metrics for internal administration
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              // In development, docs are served on backend port (3001)
              // In production, same domain so relative path works
              const docsUrl = import.meta.env.DEV
                ? 'http://localhost:3001/docs'
                : '/docs'
              window.open(docsUrl, '_blank')
            }}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            API Documentation
          </Button>
        </div>
      </div>

      {/* Key Metrics Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4 overflow-visible"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-900">Key Metrics</h2>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            Failed to load metrics: {error}
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {loading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </Card>
              ))}
            </>
          ) : metrics ? (
            <>
              <MetricCard
                title="Total Tenants"
                value={metrics.tenants.total}
                subtitle={`${metrics.tenants.newThisWeek} new this week • ${metrics.tenants.newThisMonth} this month`}
                trend={getTrend(metrics.tenants.newThisWeek, metrics.tenants.newThisMonth)}
                icon={<Building className="h-5 w-5" />}
                color="blue"
              />
              
              <MetricCard
                title="Total Users"
                value={metrics.users.total}
                subtitle={`${metrics.users.newThisWeek} new this week • ${metrics.users.newThisMonth} this month`}
                trend={getTrend(metrics.users.newThisWeek, metrics.users.newThisMonth)}
                icon={<Users className="h-5 w-5" />}
                color="green"
              />
              
              <MetricCard
                title="Active Applications"
                value={metrics.applications.active}
                subtitle="Applications currently available"
                trend="stable"
                icon={<Package className="h-5 w-5" />}
                color="purple"
              />
              
              <MetricCard
                title="Active Licenses"
                value={metrics.licenses.active}
                subtitle="Total active tenant licenses"
                trend="stable"
                icon={<Activity className="h-5 w-5" />}
                color="orange"
              />
            </>
          ) : (
            <div className="col-span-4 text-center py-8">
              <p className="text-gray-500">No metrics data available</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Background Jobs Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="border-b border-gray-200/50 pb-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 bg-purple-600 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-900">Background Jobs</h2>
          </div>
          <p className="text-gray-600 ml-6">
            Automated maintenance tasks that run daily at night to optimize storage and update transcription costs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobsLoading ? (
            <>
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </Card>
              ))}
            </>
          ) : jobs && jobs.length > 0 ? (
            <>
              {jobs.map((job) => {
                const statusConfig = {
                  running: {
                    icon: <Loader className="h-5 w-5 animate-spin" />,
                    color: 'bg-blue-100 text-blue-700 border-blue-200',
                    label: 'Running'
                  },
                  success: {
                    icon: <CheckCircle className="h-5 w-5" />,
                    color: 'bg-green-100 text-green-700 border-green-200',
                    label: 'Success'
                  },
                  failed: {
                    icon: <XCircle className="h-5 w-5" />,
                    color: 'bg-red-100 text-red-700 border-red-200',
                    label: 'Failed'
                  }
                }

                const config = statusConfig[job.status]
                const jobNameDisplay = job.job_name === 'audio_cleanup' ? 'Audio Cleanup' : 'Cost Update'

                return (
                  <Card key={job.job_name} className="border-gray-200/50 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Job Name & Status */}
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">{jobNameDisplay}</h3>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${config.color}`}>
                            {config.icon}
                            <span className="text-sm font-medium">{config.label}</span>
                          </div>
                        </div>

                        {/* Last Run Time */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Last run: {new Date(job.started_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>

                        {/* Duration */}
                        {job.duration_ms && (
                          <div className="text-sm text-gray-600">
                            Duration: {(job.duration_ms / 1000).toFixed(2)}s
                          </div>
                        )}

                        {/* Stats */}
                        {job.stats && Object.keys(job.stats).length > 0 && (
                          <div className="pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {job.stats.deleted !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Deleted:</span>
                                  <span className="font-medium text-gray-900">{job.stats.deleted}</span>
                                </div>
                              )}
                              {job.stats.failed !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Failed:</span>
                                  <span className="font-medium text-red-600">{job.stats.failed}</span>
                                </div>
                              )}
                              {job.stats.updated !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Updated:</span>
                                  <span className="font-medium text-gray-900">{job.stats.updated}</span>
                                </div>
                              )}
                              {job.stats.unchanged !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Unchanged:</span>
                                  <span className="font-medium text-gray-900">{job.stats.unchanged}</span>
                                </div>
                              )}
                              {job.stats.skipped !== undefined && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Skipped:</span>
                                  <span className="font-medium text-orange-600">{job.stats.skipped}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Error Message */}
                        {job.error_message && (
                          <Alert variant="error" className="mt-3">
                            {job.error_message}
                          </Alert>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </>
          ) : (
            <EmptyState
              title="No job executions yet"
              description="Background jobs will appear here once they start running"
              icon={<Clock className="h-6 w-6 text-gray-400" />}
              className="col-span-2"
            />
          )}
        </div>
      </motion.section>

    </div>
  )
}