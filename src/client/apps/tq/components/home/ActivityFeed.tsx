import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@client/common/ui'
import { FileText, Users, Receipt, CheckCircle, Clock } from 'lucide-react'

interface Activity {
  id: string
  type: 'patient_added' | 'session_created' | 'quote_created' | 'quote_approved' | 'session_completed'
  message: string
  timestamp: string
  icon: 'patient' | 'session' | 'quote' | 'approved' | 'completed'
  path?: string
}

interface ActivityFeedProps {
  activities: Activity[]
  isLoading?: boolean
  onActivityClick?: (path: string) => void
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, isLoading = false, onActivityClick }) => {
  const [flashingId, setFlashingId] = React.useState<string | null>(null)

  const handleDoubleClick = (activity: Activity) => {
    if (activity.path && onActivityClick) {
      setFlashingId(activity.id)
      setTimeout(() => setFlashingId(null), 300)
      onActivityClick(activity.path)
    }
  }
  const getIcon = (iconType: Activity['icon']) => {
    const iconClass = "w-5 h-5"
    switch (iconType) {
      case 'patient':
        return <Users className={`${iconClass} text-[#5ED6CE]`} />
      case 'session':
        return <FileText className={`${iconClass} text-[#B725B7]`} />
      case 'quote':
        return <Receipt className={`${iconClass} text-[#E91E63]`} />
      case 'approved':
        return <CheckCircle className={`${iconClass} text-green-600`} />
      case 'completed':
        return <Clock className={`${iconClass} text-gray-600`} />
      default:
        return <FileText className={`${iconClass} text-gray-600`} />
    }
  }

  const getIconBgColor = (iconType: Activity['icon']) => {
    switch (iconType) {
      case 'patient':
        return 'bg-green-100'
      case 'session':
        return 'bg-purple-100'
      case 'quote':
        return 'bg-pink-100'
      case 'approved':
        return 'bg-green-100'
      case 'completed':
        return 'bg-gray-100'
      default:
        return 'bg-gray-100'
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div>
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex items-center gap-4 py-3 px-4 transition-colors duration-200 ${
                  activity.path ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${
                  index !== activities.length - 1 ? 'border-b border-gray-100' : ''
                } ${flashingId === activity.id ? 'ring-2 ring-[#B725B7] ring-inset bg-purple-50' : ''}`}
                onDoubleClick={() => handleDoubleClick(activity)}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconBgColor(activity.icon)}`}>
                  {getIcon(activity.icon)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
        )}
      </CardContent>
    </Card>
  )
}
