import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserSettingsModal } from '../components/UserSettingsModal'

export const UserConfigurations: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true)
  const navigate = useNavigate()

  const handleClose = () => {
    setIsOpen(false)
    navigate('/') // Redirect to home when modal closes
  }

  return <UserSettingsModal isOpen={isOpen} onClose={handleClose} />
}
