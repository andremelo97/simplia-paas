import React, { useState } from 'react'
import { Card, CardContent } from '@client/common/ui'
import { LucideIcon } from 'lucide-react'

interface QuickActionCardProps {
  icon: LucideIcon
  title: string
  description?: string
  onClick: () => void
  colorClass: 'purple' | 'pink' | 'blue'
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon: Icon,
  title,
  description,
  onClick,
  colorClass
}) => {
  const [isClicking, setIsClicking] = useState(false)

  const colorClasses = {
    purple: 'bg-purple-100 text-[#B725B7]',
    pink: 'bg-pink-100 text-[#E91E63]',
    blue: 'bg-purple-100 text-[#B725B7]'
  }

  const handleClick = () => {
    setIsClicking(true)
    setTimeout(() => setIsClicking(false), 200)
    onClick()
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-95 ${
        isClicking ? 'ring-2 ring-[#B725B7] ring-offset-2' : ''
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-6 flex flex-col items-center text-center h-32 justify-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform ${
          isClicking ? 'scale-110' : ''
        } ${colorClasses[colorClass]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
