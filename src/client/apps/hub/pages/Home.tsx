import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Lock, Grid3x3 } from 'lucide-react'
import { Card, Button } from '@client/common/ui'
import { useAuthStore } from '../store/auth'
import { hubService } from '../services/hub'
import { publishFeedback } from '@client/common/feedback'

interface UserApp {
  slug: string
  name: string
  url: string
  iconUrl?: string
  description?: string
}

export const Home: React.FC = () => {
  const { user } = useAuthStore()
  const [apps, setApps] = useState<UserApp[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadUserApps()
  }, [])

  const loadUserApps = async () => {
    try {
      setIsLoading(true)
      const response = await hubService.getMyApps()
      setApps(response.apps || [])
    } catch (error) {
      publishFeedback({
        kind: 'error',
        code: 'LOAD_APPS_ERROR',
        title: 'Error',
        message: 'Failed to load your applications'
      })
      setApps([]) // Ensure apps is always an array
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppClick = (app: UserApp) => {
    if (app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer')
    } else {
      publishFeedback({
        kind: 'info',
        code: 'APP_URL_NOT_CONFIGURED',
        title: 'Info',
        message: 'Application URL not configured yet.'
      })
    }
  }

  const getAppIcon = (app: UserApp) => {
    if (app.iconUrl) {
      return (
        <img 
          src={app.iconUrl} 
          alt={`${app.name} icon`}
          className="w-8 h-8 object-contain"
        />
      )
    }
    return <Grid3x3 className="w-8 h-8" />
  }

  const getAppColor = () => {
    return '#3B82F6' // Default blue for all apps
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here are your available applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="w-8 h-8 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded mb-4"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here are your available applications
        </p>
      </div>

      {(apps || []).length === 0 ? (
        <Card className="p-12 text-center">
          <Grid3x3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No applications
          </h3>
          <p className="text-gray-600 mb-6">
            Contact your administrator to get access to applications.
          </p>
          <Button onClick={loadUserApps}>
            Refresh
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(apps || []).map((app, index) => (
            <motion.div
              key={app.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                onClick={() => handleAppClick(app)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${getAppColor()}20` }}
                  >
                    <div style={{ color: getAppColor() }}>
                      {getAppIcon(app)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">
                  {app.name}
                </h3>
                
                {app.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {app.description}
                  </p>
                )}

              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}