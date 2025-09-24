import React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Grid3x3 } from 'lucide-react'
import { Card, Button, StatusBadge, Badge } from '@client/common/ui'
import { useAuthStore } from '../store/auth'
import { publishFeedback } from '@client/common/feedback'
import { TenantEntitlementsSection } from '../components/TenantEntitlementsSection'

interface UserApp {
  slug: string
  name: string
  roleInApp: string
  expiresAt: string | null
  licenseStatus: string
  url?: string
  iconUrl?: string
  description?: string
}

export const Home: React.FC = () => {
  const { user, tenantName, isLoading, loadUserProfile } = useAuthStore()

  // Get apps directly from user state
  const apps = user?.allowedApps || []

  const refreshApps = async () => {
    try {
      await loadUserProfile()
    } catch (error) {
      publishFeedback({
        kind: 'error',
        code: 'LOAD_APPS_ERROR',
        title: 'Error',
        message: 'Failed to refresh your applications'
      })
    }
  }

  const handleAppClick = (app: UserApp) => {
    // Special handling for TQ app - SSO integration
    if (app.slug === 'tq') {
      const { token, tenantId } = useAuthStore.getState()

      if (token && tenantId) {
        // Open TQ with SSO parameters - redirect directly to home after SSO
        const tqUrl = `http://localhost:3005/?token=${encodeURIComponent(token)}&tenantId=${tenantId}`
        window.open(tqUrl, '_blank', 'noopener,noreferrer')
      } else {
        publishFeedback({
          kind: 'error',
          code: 'SSO_TOKEN_MISSING',
          title: 'Error',
          message: 'Unable to open TQ - authentication token missing.'
        })
      }
      return
    }

    // Default handling for other apps
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
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg text-gray-600">Loading...</div>
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
          {tenantName ? `Your applications at ${tenantName}` : 'Your available applications'}
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
          <Button onClick={refreshApps}>
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

                <div className="mb-3 space-x-2">
                  <StatusBadge
                    status={app.licenseStatus as 'active' | 'inactive' | 'suspended'}
                    size="sm"
                  />
                  {app.roleInApp && (
                    <Badge variant="secondary" size="sm">
                      {app.roleInApp}
                    </Badge>
                  )}
                </div>

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

      {/* Admin Section - Only visible for admin users */}
      <TenantEntitlementsSection userRole={user?.role || ''} />
    </div>
  )
}