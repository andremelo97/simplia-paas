import React from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { RouteGuard } from '../components/RouteGuard'
import { AdminLayout } from '../layouts/AdminLayout'
import { Login } from '../features/auth/Login'
import { Dashboard } from '../features/dashboard/Dashboard'
import { TenantsList } from '../features/tenants/TenantsList'
import { CreateTenant } from '../features/tenants/CreateTenant'
import { EditTenantPage } from '../features/tenants/EditTenant'
import { UsersList } from '../features/users/UsersList'
import { CreateUser } from '../features/users/CreateUser'
import { EditUser } from '../features/users/EditUser'
import { ApplicationsList } from '../features/applications/ApplicationsList'
import { ApplicationPricing } from '../features/applications/pricing/ApplicationPricing'
import { TenantLicensesPage } from '../features/tenants/licenses/TenantLicensesPage'
import { TenantDetailLayout } from '../features/tenants/detail/TenantDetailLayout'
import { TenantOverviewTab } from '../features/tenants/detail/tabs/TenantOverviewTab'
import { TenantUsersTab } from '../features/tenants/detail/tabs/TenantUsersTab'
import { TenantLicensesTab } from '../features/tenants/detail/tabs/TenantLicensesTab'
import { TenantAddressesTab } from '../features/tenants/detail/tabs/TenantAddressesTab'
import { TenantContactsTab } from '../features/tenants/detail/tabs/TenantContactsTab'

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

const TenantViewRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/tenants/${id}/overview`} replace />
}

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
        <Route path="tenants/:id" element={<TenantViewRedirect />} />
        
        {/* Tenant Detail Routes with Tabs */}
        <Route path="tenants/:tenantId" element={<TenantDetailLayout />}>
          <Route path="overview" element={<TenantOverviewTab />} />
          <Route path="users" element={<TenantUsersTab />} />
          <Route path="licenses" element={<TenantLicensesTab />} />
          <Route path="addresses" element={<TenantAddressesTab />} />
          <Route path="contacts" element={<TenantContactsTab />} />
        </Route>
        
        {/* Single tenant routes */}
        <Route path="tenants/:id/edit" element={<EditTenantPage />} />
        
        {/* Users routes */}
        <Route path="users" element={<UsersList />} />
        <Route path="users/create" element={<CreateUser />} />
        <Route path="tenants/:tenantId/users" element={<UsersList />} />
        <Route path="tenants/:tenantId/users/create" element={<CreateUser />} />
        <Route path="tenants/:tenantId/users/:userId/edit" element={<EditUser />} />
        
        {/* Applications routes */}
        <Route path="applications" element={<ApplicationsList />} />
        <Route path="applications/:applicationId/pricing" element={<ApplicationPricing />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}