import React, { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@client/common/ui'
import { FileText } from 'lucide-react'
import { useAuthStore } from '../../shared/store'
import { consumeSso, hasSsoParams } from '../../lib/consumeSso'

export const Home: React.FC = () => {
  const { user } = useAuthStore()

  // Handle SSO on home page load
  useEffect(() => {
    const handleSso = async () => {
      if (hasSsoParams()) {
        try {
          await consumeSso()
        } catch (error) {
          console.error('SSO failed on home page:', error)
        }
      }
    }

    handleSso()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-gray-600 mt-1">
          TQ - Transcription Quote System
        </p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The TQ application is under development. Features will be added soon.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-500">
            Manage patients, transcription sessions, and generate quotes.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}