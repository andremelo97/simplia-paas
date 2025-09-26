import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'

export const TQApp: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="tq-app">
        <AppRoutes />
      </div>
    </BrowserRouter>
  )
}