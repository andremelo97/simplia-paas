import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { FeedbackHost } from '@client/common/feedback'
import { useAuthStore } from './store/auth'
import { installTenantInterceptor } from '@client/common/auth/interceptor'
import '../../index.css'

// Initialize tenant interceptor
installTenantInterceptor()

// Initialize auth store
useAuthStore.getState().initialize()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <FeedbackHost />
  </React.StrictMode>
)