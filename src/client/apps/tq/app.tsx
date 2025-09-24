import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { Toaster } from '@client/common/ui'

export const TQApp: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="tq-app">
        <AppRoutes />
        <Toaster />
      </div>
    </BrowserRouter>
  )
}