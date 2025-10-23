import React from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { UserConfigurations } from './pages/UserConfigurations'
import { Configurations } from './features/configurations/Configurations'
import { BrandingConfiguration } from './features/configurations/BrandingConfiguration'
import { CommunicationConfiguration } from './features/configurations/CommunicationConfiguration'
import { TranscriptionUsageConfiguration } from './features/configurations/TranscriptionUsageConfiguration'

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, isHydrated } = useAuthStore()

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

const AdminRoute: React.FC = () => {
  const { user, isAuthenticated, isLoading, isHydrated } = useAuthStore()

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

const PublicRoute: React.FC = () => {
  const { isAuthenticated, isLoading, isHydrated } = useAuthStore()

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <PublicRoute />,
    children: [
      {
        index: true,
        element: <Login />
      }
    ]
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            index: true,
            element: <Home />
          },
          {
            path: 'user-configurations',
            element: <UserConfigurations />
          },
          {
            path: 'configurations',
            element: <AdminRoute />,
            children: [
              {
                path: '',
                element: <Configurations />,
                children: [
                  {
                    index: true,
                    element: <Navigate to="branding" replace />
                  },
                  {
                    path: 'branding',
                    element: <BrandingConfiguration />
                  },
                  {
                    path: 'communication',
                    element: <CommunicationConfiguration />
                  },
                  {
                    path: 'transcription',
                    element: <TranscriptionUsageConfiguration />
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
])