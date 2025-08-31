import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authService } from '../services/auth'
import { useAuthStore } from '../store'

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requiredRole?: 'operations' | 'manager' | 'admin'
  requiredPlatformRole?: 'internal_admin'
  requiredApp?: string
  redirectTo?: string
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  requiredPlatformRole,
  requiredApp,
  redirectTo = '/login'
}) => {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  if (requiredRole && !authService.hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requiredPlatformRole && !authService.hasPlatformRole(requiredPlatformRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  if (requiredApp && !authService.hasAppAccess(requiredApp)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}