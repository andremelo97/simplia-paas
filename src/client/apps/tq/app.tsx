import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { FeedbackHost } from '@client/common/feedback/FeedbackHost'
import { Toaster } from '@client/common/ui'

export const TQApp: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="tq-app">
        <AppRoutes />
        <FeedbackHost />
        <Toaster />
      </div>
    </BrowserRouter>
  )
}