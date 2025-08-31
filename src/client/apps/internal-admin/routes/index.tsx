import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { RouteGuard } from '../components/RouteGuard'
import { AdminLayout } from '../layouts/AdminLayout'
import { Login } from '../features/auth/Login'
import { Dashboard } from '../features/dashboard/Dashboard'
import { TenantsList } from '../features/tenants/TenantsList'
import { CreateTenant } from '../features/tenants/CreateTenant'

const NotFound: React.FC = () => (
  <div className="min-h-64 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
      <p className="text-gray-600">The page you're looking for doesn't exist.</p>
    </div>
  </div>
)

const Unauthorized: React.FC = () => (
  <div className="min-h-64 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">403 - Unauthorized</h1>
      <p className="text-gray-600">You don't have permission to access this resource.</p>
    </div>
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      <Route
        path="/*"
        element={
          <RouteGuard requireAuth>
            <AdminLayout />
          </RouteGuard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tenants" element={<TenantsList />} />
        <Route path="tenants/create" element={<CreateTenant />} />
        <Route path="users" element={<div>Users page (coming soon)</div>} />
        <Route path="applications" element={<div>Applications page (coming soon)</div>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}