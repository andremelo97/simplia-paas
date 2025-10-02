import React from 'react'
import { Link2 } from 'lucide-react'

export const LinksEmpty: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Link2 className="w-8 h-8 text-gray-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No public links yet
      </h3>

      <p className="text-gray-600 text-center max-w-md">
        Create public quote links from the Quotes page to share with clients
      </p>
    </div>
  )
}
