import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { Modal } from '@client/common/ui/Modal'
import { Button } from '@client/common/ui/Button'
import { Input } from '@client/common/ui/Input'
import { Label } from '@client/common/ui/Label'
import { hubService } from '../services/hub'
import { useAuthStore } from '../store/auth'

interface UserSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation('hub')
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const getPasswordStrength = (password: string): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: '' }

    let score = 0
    if (password.length >= 6) score++
    if (password.length >= 10) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 1) return { level: 1, label: t('user_settings.password.strength.very_weak'), color: 'bg-red-500' }
    if (score === 2) return { level: 2, label: t('user_settings.password.strength.weak'), color: 'bg-orange-500' }
    if (score === 3) return { level: 3, label: t('user_settings.password.strength.fair'), color: 'bg-yellow-500' }
    if (score === 4) return { level: 4, label: t('user_settings.password.strength.strong'), color: 'bg-green-500' }
    return { level: 5, label: t('user_settings.password.strength.very_strong'), color: 'bg-green-600' }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  const validateField = (field: string) => {
    let error = ''

    switch (field) {
      case 'currentPassword':
        if (!currentPassword) error = t('user_settings.password.validation.current_required')
        break
      case 'newPassword':
        if (!newPassword) {
          error = t('user_settings.password.validation.new_required')
        } else if (newPassword.length < 6) {
          error = t('user_settings.password.validation.new_min_length')
        } else if (currentPassword && currentPassword === newPassword) {
          error = t('user_settings.password.validation.same_as_current')
        }
        break
      case 'confirmPassword':
        if (!confirmPassword) {
          error = t('user_settings.password.validation.confirm_required')
        } else if (newPassword !== confirmPassword) {
          error = t('user_settings.password.validation.passwords_dont_match')
        }
        break
    }

    setErrors(prev => ({ ...prev, [field]: error }))
    return !error
  }

  const validateForm = (): boolean => {
    const fields = ['currentPassword', 'newPassword', 'confirmPassword']
    let allValid = true
    for (const field of fields) {
      if (!validateField(field)) allValid = false
    }
    return allValid
  }

  const handleChangePassword = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      await hubService.changePassword(currentPassword, newPassword)

      // Success feedback handled automatically by HTTP interceptor
      // Wait 2 seconds before logout
      setTimeout(() => {
        logout()
        navigate('/login')
      }, 2000)
    } catch (error) {
      // Error feedback handled automatically by HTTP interceptor
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
      onClose()
    }
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      title={t('user_settings.title')}
      size="md"
    >
      <div className="px-6 py-4 space-y-6">
        {/* Password Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('user_settings.password.section_title')}
          </h3>

          <div className="space-y-4">
            <div>
              <Label htmlFor="current-password">
                {t('user_settings.password.current_password')}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: '' }))
                  }}
                  onBlur={() => validateField('currentPassword')}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.currentPassword}</p>
              )}
            </div>

            <div>
              <Label htmlFor="new-password">
                {t('user_settings.password.new_password')}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }))
                  }}
                  onBlur={() => validateField('newPassword')}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.level ? passwordStrength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs ${
                    passwordStrength.level <= 2 ? 'text-red-600' : passwordStrength.level === 3 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
              {errors.newPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirm-password">
                {t('user_settings.password.confirm_password')}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }))
                  }}
                  onBlur={() => validateField('confirmPassword')}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('user_settings.password.submitting')}
                </span>
              ) : (
                t('user_settings.password.submit')
              )}
            </Button>
          </div>
        </section>

        {/* Placeholder for future sections */}
        {/*
        <Separator className="my-6" />
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Other Settings
          </h3>
        </section>
        */}
      </div>
    </Modal>
  )
}
