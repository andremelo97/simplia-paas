import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { RouteGuard } from '../shared/components/RouteGuard'
import { Layout } from '../shared/components/Layout'
import { Login } from '../features/auth/Login'
import { Home } from '../features/home/Home'
import { NewSession } from '../features/session/NewSession'
import { Patients } from '../features/patients/Patients'
import { CreatePatient } from '../features/patients/CreatePatient'
import { EditPatient } from '../features/patients/EditPatient'

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
      <p className="text-gray-600">You don't have permission to access TQ application.</p>
    </div>
  </div>
)


// Redirect to Hub helper component
const RedirectToHub: React.FC = () => {
  React.useEffect(() => {
    window.location.href = 'http://localhost:3003'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting to Hub...</h1>
        <p className="text-gray-600">Please access TQ through the Hub application.</p>
      </div>
    </div>
  )
}

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="/*"
        element={
          <RouteGuard requireAuth requiredApp="tq">
            <Layout />
          </RouteGuard>
        }
      >
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="new-session" element={<NewSession />} />
        <Route path="sessions" element={<Home />} />
        <Route path="patients" element={<Patients />} />
        <Route path="patients/create" element={<CreatePatient />} />
        <Route path="patients/:id/edit" element={<EditPatient />} />
        <Route path="quotes" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}