import React from 'react'
import { Card, CardHeader, CardContent } from '@client/common/ui'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Users, Building, Package, Activity } from 'lucide-react'

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

const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 1,
      action: 'New tenant created',
      details: 'Clinic ABC (tenant_clinic_abc)',
      timestamp: '2 hours ago',
      user: 'consultoriasimplia@gmail.com'
    },
    {
      id: 2,
      action: 'User access granted',
      details: 'TQ application access for user john.doe',
      timestamp: '4 hours ago',
      user: 'consultoriasimplia@gmail.com'
    },
    {
      id: 3,
      action: 'License renewed',
      details: 'PM application for Tenant XYZ',
      timestamp: '6 hours ago',
      user: 'system'
    }
  ]

  return (
    <Card>
      <CardHeader className="p-6 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.action}
                </p>
                <p className="text-sm text-gray-600">
                  {activity.details}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.timestamp} • by {activity.user}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="border-b border-gray-200/50 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-600 mt-2 text-lg">
          Platform overview and key metrics for internal administration
        </p>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total Tenants"
            value={42}
            subtitle="5 new tenants this month"
            trend="up"
            icon={<Building className="h-5 w-5" />}
            color="blue"
          />
          
          <MetricCard
            title="Total Users"
            value={186}
            subtitle="12 new users this week"
            trend="up"
            icon={<Users className="h-5 w-5" />}
            color="green"
          />
          
          <MetricCard
            title="Active Applications"
            value={4}
            subtitle="TQ, PM, Billing, Reports"
            trend="stable"
            icon={<Package className="h-5 w-5" />}
            color="purple"
          />
          
          <MetricCard
            title="License Utilization"
            value="78%"
            subtitle="Average across all tenants"
            trend="stable"
            icon={<Activity className="h-5 w-5" />}
            color="orange"
          />
        </div>
      </motion.section>

      {/* Activity & Status Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-emerald-600 rounded-full"></div>
          <h2 className="text-xl font-semibold text-gray-900">Activity & System Status</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <RecentActivity />
          
          <Card className="border-gray-200/50 shadow-sm">
            <CardHeader className="p-6 pb-4">
              <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
              <p className="text-sm text-gray-500 mt-1">Current operational status of platform services</p>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-200/30">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Internal API</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Operational
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-200/30">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Database</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Operational
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-200/30">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">Authentication Service</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Operational
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50/50 border border-yellow-200/30">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-700">License Validation</span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                    Maintenance
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.section>
    </div>
  )
}