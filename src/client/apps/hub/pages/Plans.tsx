import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Home, LogIn, Mail, Crown } from 'lucide-react'
import { Button, Card } from '@client/common/ui'
import { useAuthStore } from '../store/auth'

// Stripe Checkout URLs
const CHECKOUT_URLS: Record<string, string> = {
  trial: 'https://buy.stripe.com/test_eVq28r5LWchW3zU7I84Vy01',
  starter: 'https://buy.stripe.com/test_3cI3cvfmw4PudaubYo4Vy00',
  solo: 'https://buy.stripe.com/test_dRmbJ1deoeq4daufaA4Vy02',
  duo: 'https://buy.stripe.com/test_5kQ3cv8Y85Ty9Yi6E44Vy03',
  practice: 'https://buy.stripe.com/test_eVqfZhb6geq41rM3rS4Vy04'
}

interface Plan {
  id: string
  name: string
  price: string
  description: string
  hours: string
  hoursPerDay: string
  users: string
  features: string[]
  featured?: 'purple' | 'black' | 'bestValue'
  checkoutUrl?: string
}

export const Plans: React.FC = () => {
  const { t } = useTranslation('hub')
  const { isAuthenticated } = useAuthStore()

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 'R$ 119',
      description: t('plans.starter.description'),
      hours: '40',
      hoursPerDay: '~2h/dia',
      users: '1 Admin',
      features: [
        t('plans.features.hours_40'),
        t('plans.features.admin_1'),
        t('plans.features.monolingual'),
        t('plans.features.templates_3'),
        t('plans.features.setup_included'),
        t('plans.features.standard_support')
      ],
      checkoutUrl: CHECKOUT_URLS.starter
    },
    {
      id: 'solo',
      name: 'Solo',
      price: 'R$ 189',
      description: t('plans.solo.description'),
      hours: '80',
      hoursPerDay: '~4h/dia',
      users: '1 Admin + 1 Ops',
      featured: 'purple',
      features: [
        t('plans.features.hours_80'),
        t('plans.features.admin_ops'),
        t('plans.features.monolingual'),
        t('plans.features.templates_3'),
        t('plans.features.setup_included'),
        t('plans.features.template_support'),
        t('plans.features.standard_support')
      ],
      checkoutUrl: CHECKOUT_URLS.solo
    },
    {
      id: 'duo',
      name: 'Duo',
      price: 'R$ 349',
      description: t('plans.duo.description'),
      hours: '160',
      hoursPerDay: '~8h/dia',
      users: '1 Admin + 1 Manager',
      featured: 'black',
      features: [
        t('plans.features.hours_160'),
        t('plans.features.admin_manager'),
        t('plans.features.additional_licenses'),
        t('plans.features.multilingual'),
        t('plans.features.templates_3'),
        t('plans.features.setup_included'),
        t('plans.features.template_support'),
        t('plans.features.priority_support')
      ],
      checkoutUrl: CHECKOUT_URLS.duo
    },
    {
      id: 'practice',
      name: 'Practice',
      price: 'R$ 469',
      description: t('plans.practice.description'),
      hours: '240',
      hoursPerDay: '~12h/dia',
      users: '3 licenças',
      featured: 'bestValue',
      features: [
        t('plans.features.hours_240'),
        t('plans.features.licenses_3'),
        t('plans.features.additional_licenses'),
        t('plans.features.overage_allowed'),
        t('plans.features.multilingual'),
        t('plans.features.templates_3'),
        t('plans.features.setup_included'),
        t('plans.features.template_support'),
        t('plans.features.priority_support')
      ],
      checkoutUrl: CHECKOUT_URLS.practice
    },
    {
      id: 'vip',
      name: 'VIP',
      price: t('plans.custom_price'),
      description: t('plans.vip.description'),
      hours: 'Custom',
      hoursPerDay: t('plans.custom'),
      users: t('plans.custom'),
      features: [
        t('plans.features.custom_hours'),
        t('plans.features.unlimited_licenses'),
        t('plans.features.overage_allowed'),
        t('plans.features.multilingual'),
        t('plans.features.unlimited_templates'),
        t('plans.features.dedicated_setup'),
        t('plans.features.custom_integration'),
        t('plans.features.dedicated_support')
      ]
    }
  ]

  const handleContactSales = () => {
    window.location.href = 'mailto:admin@livocare.ai?subject=Interesse em Plano VIP'
  }

  const handleGoToHub = () => {
    window.location.href = 'https://hub.livocare.ai'
  }

  const handleGoToLogin = () => {
    window.location.href = 'https://hub.livocare.ai/login'
  }

  const handleSelectPlan = (plan: Plan) => {
    if (plan.checkoutUrl) {
      window.open(plan.checkoutUrl, '_blank')
    } else {
      handleContactSales()
    }
  }

  const getCardStyle = (plan: Plan) => {
    if (plan.featured === 'bestValue') {
      return 'ring-2 ring-[#E91E63] shadow-xl'
    }
    if (plan.featured === 'purple') {
      return 'ring-2 ring-[#B725B7] shadow-lg'
    }
    if (plan.featured === 'black') {
      return 'ring-2 ring-gray-900 shadow-lg'
    }
    return ''
  }

  const getHeaderStyle = (plan: Plan) => {
    if (plan.featured === 'bestValue') {
      return 'bg-gradient-to-r from-[#E91E63] to-[#B725B7]'
    }
    if (plan.featured === 'purple') {
      return 'bg-gradient-to-r from-[#B725B7] to-[#E91E63]'
    }
    if (plan.featured === 'black') {
      return 'bg-gradient-to-r from-gray-800 to-gray-900'
    }
    if (plan.id === 'vip') {
      return 'bg-gradient-to-r from-amber-500 to-amber-600'
    }
    return 'bg-gradient-to-r from-gray-600 to-gray-700'
  }

  const getBadgeText = (plan: Plan) => {
    if (plan.featured === 'bestValue') {
      return t('plans.best_value')
    }
    if (plan.featured === 'purple') {
      return t('plans.popular')
    }
    if (plan.featured === 'black') {
      return t('plans.recommended')
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900">
              TQ - Transcription & Quote
            </h1>

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
            <h2 className="text-3xl font-bold text-gray-900">
              {t('plans.title')}
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              {t('plans.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Trial Banner */}
      <div className="bg-gradient-to-r from-[#5ED6CE] to-[#0a8a80] text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg font-medium flex items-center justify-center gap-2">
            <span className="text-2xl">🎁</span>
            {t('plans.trial_banner')}
            <a
              href={CHECKOUT_URLS.trial}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold hover:no-underline ml-2"
            >
              {t('plans.start_trial')}
            </a>
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {plans.map((plan) => {
            const badge = getBadgeText(plan)
            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden flex flex-col ${getCardStyle(plan)}`}
              >
                {badge && (
                  <div className="absolute top-0 right-0 bg-[#E91E63] text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    {badge}
                  </div>
                )}

                {/* Plan Header */}
                <div className={`${getHeaderStyle(plan)} px-4 py-6 text-white`}>
                  {plan.id === 'vip' && <Crown className="h-8 w-8 mb-2" />}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{plan.description}</p>
                  <div className="mt-3">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.price !== t('plans.custom_price') && (
                      <span className="text-white/80 ml-1 text-sm">{t('plans.per_month')}</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-white/90">
                    <span className="font-semibold">{plan.hours}h</span> {t('plans.per_month_short')} ({plan.hoursPerDay})
                  </div>
                  <div className="text-sm text-white/80">
                    {plan.users}
                  </div>
                </div>

                {/* Features */}
                <div className="px-4 py-4 flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-4 pb-4 mt-auto">
                  <Button
                    variant={plan.featured || plan.id === 'vip' ? 'primary' : 'secondary'}
                    className="w-full flex items-center justify-center gap-2 text-sm"
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.checkoutUrl ? (
                      t('plans.select_plan')
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        {t('plans.contact_sales')}
                      </>
                    )}
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
          <p className="text-gray-600 mb-4">
            {t('plans.questions_description')}
          </p>
          <p className="text-gray-500 mb-6">
            {t('plans.email_us')}{' '}
            <a
              href="mailto:admin@livocare.ai"
              className="text-[#B725B7] font-semibold hover:underline"
            >
              admin@livocare.ai
            </a>
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
