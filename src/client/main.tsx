import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './apps/internal-admin/routes/index'
import { FeedbackHost } from './common/feedback'
import './common/i18n' // Initialize i18n
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
      <FeedbackHost />
    </BrowserRouter>
  </React.StrictMode>
)