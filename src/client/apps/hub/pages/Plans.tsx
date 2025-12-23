import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Home, LogIn, Mail, Zap, Crown, Rocket } from 'lucide-react'
import { Button, Card } from '@client/common/ui'
import { useAuthStore } from '../store/auth'

interface PlanFeature {
  name: string
  starter: boolean | string
  professional: boolean | string
  enterprise: boolean | string
}

export const Plans: React.FC = () => {
  const { t } = useTranslation('hub')
  const { isAuthenticated } = useAuthStore()

  const plans = [
    {
      id: 'starter',
      name: t('plans.starter.name'),
      description: t('plans.starter.description'),
      price: 'R$ 297',
      period: t('plans.per_month'),
      icon: Zap,
      color: 'from-blue-500 to-blue-600',
      popular: false
    },
    {
      id: 'professional',
      name: t('plans.professional.name'),
      description: t('plans.professional.description'),
      price: 'R$ 497',
      period: t('plans.per_month'),
      icon: Crown,
      color: 'from-[#B725B7] to-[#E91E63]',
      popular: true
    },
    {
      id: 'enterprise',
      name: t('plans.enterprise.name'),
      description: t('plans.enterprise.description'),
      price: t('plans.custom_price'),
      period: '',
      icon: Rocket,
      color: 'from-gray-700 to-gray-900',
      popular: false
    }
  ]

  const features: PlanFeature[] = [
    { name: t('plans.features.monthly_minutes'), starter: '40h', professional: '100h', enterprise: t('plans.features.unlimited') },
    { name: t('plans.features.transcription_quality'), starter: 'Nova-3', professional: 'Nova-3', enterprise: 'Nova-3' },
    { name: t('plans.features.custom_limits'), starter: false, professional: true, enterprise: true },
    { name: t('plans.features.overage_allowed'), starter: false, professional: true, enterprise: true },
    { name: t('plans.features.language_detection'), starter: false, professional: true, enterprise: true },
    { name: t('plans.features.priority_support'), starter: false, professional: true, enterprise: true },
    { name: t('plans.features.dedicated_account'), starter: false, professional: false, enterprise: true },
    { name: t('plans.features.custom_integration'), starter: false, professional: false, enterprise: true },
  ]

  const handleContactSales = () => {
    window.location.href = 'mailto:contato@livocare.ai?subject=Interesse em Plano de Transcrição'
  }

  const handleGoToHub = () => {
    window.location.href = 'https://hub.livocare.ai'
  }

  const handleGoToLogin = () => {
    window.location.href = 'https://hub.livocare.ai/login'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img
                src="https://frfrxusmzrhgfkwclxon.supabase.co/storage/v1/object/public/public-assets//logos/tq-logo-purple.png"
                alt="TQ"
                className="h-10"
              />
            </div>

            {/* Action Button */}
            {isAuthenticated ? (
              <Button
                variant="outline"
                onClick={handleGoToHub}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                {t('plans.go_to_hub')}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleGoToLogin}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                {t('plans.login')}
              </Button>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('plans.title')}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              {t('plans.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden ${plan.popular ? 'ring-2 ring-[#B725B7] shadow-xl' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-[#E91E63] text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    {t('plans.most_popular')}
                  </div>
                )}

                {/* Plan Header */}
                <div className={`bg-gradient-to-r ${plan.color} px-6 py-8 text-white`}>
                  <Icon className="h-10 w-10 mb-4" />
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-white/80 mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-white/80 ml-2">{plan.period}</span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 py-6">
                  <ul className="space-y-3">
                    {features.map((feature, idx) => {
                      const value = feature[plan.id as keyof PlanFeature]
                      const isIncluded = value === true || typeof value === 'string'

                      return (
                        <li key={idx} className="flex items-center gap-3">
                          {isIncluded ? (
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="h-5 w-5 text-gray-300 flex-shrink-0" />
                          )}
                          <span className={isIncluded ? 'text-gray-700' : 'text-gray-400'}>
                            {feature.name}
                            {typeof value === 'string' && (
                              <span className="font-semibold ml-1">({value})</span>
                            )}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6">
                  <Button
                    variant={plan.popular ? 'primary' : 'secondary'}
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleContactSales}
                  >
                    <Mail className="h-4 w-4" />
                    {t('plans.contact_sales')}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('plans.questions_title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('plans.questions_description')}
          </p>
          <Button
            variant="secondary"
            onClick={handleContactSales}
            className="inline-flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            {t('plans.talk_to_team')}
          </Button>
        </div>
      </div>
    </div>
  )
}
