import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Mail,
  ExternalLink,
  Users,
  ShieldCheck,
  UserCog,
  Eye,
  CheckCircle2,
  Headphones,
  Bot,
  Mic,
  FolderOpen,
  FileText,
  Layout,
  Settings,
  ArrowRight,
} from 'lucide-react'

interface FinalStepProps {
  onNavigate: (path: string) => void
}

export const FinalStep: React.FC<FinalStepProps> = ({ onNavigate }) => {
  const { t } = useTranslation('tq')

  return (
    <>
      {/* Left Column - Next Steps */}
      <div className="flex flex-col space-y-4">
        {/* Email Template */}
        <div className="border-l-4 border-[#E91E63] bg-white rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-[#E91E63]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {t('onboarding.finish.email_title', 'Email Template')}
              </h3>
              <p className="text-base text-gray-600 mt-1">
                {t(
                  'onboarding.finish.email_desc',
                  'Customize the email template used when sending documents to patients. You can change header colors, add your logo, and include contact information.'
                )}
              </p>
              <div className="bg-blue-50 rounded p-2 mt-2">
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-blue-700">
                    {t(
                      'onboarding.finish.email_hub_note',
                      'Logo and brand colors come from Hub. The email template uses those settings automatically.'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Roles */}
        <div className="border-l-4 border-[#5ED6CE] bg-white rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-[#5ED6CE]/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-[#5ED6CE]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {t('onboarding.finish.roles_title', 'User Roles')}
              </h3>
              <p className="text-base text-gray-600 mt-1">
                {t(
                  'onboarding.finish.roles_desc',
                  'TQ has three access levels to control what each team member can do:'
                )}
              </p>
              <div className="space-y-2 mt-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B725B7] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">
                      {t('onboarding.finish.role_admin', 'Admin')}
                    </span>
                    {' — '}
                    {t(
                      'onboarding.finish.role_admin_desc',
                      'Full access to all features plus configurations'
                    )}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <UserCog className="w-4 h-4 text-[#E91E63] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">
                      {t('onboarding.finish.role_manager', 'Manager')}
                    </span>
                    {' — '}
                    {t(
                      'onboarding.finish.role_manager_desc',
                      'Create sessions, manage templates, edit documents'
                    )}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">
                      {t('onboarding.finish.role_operations', 'Operations')}
                    </span>
                    {' — '}
                    {t(
                      'onboarding.finish.role_operations_desc',
                      'View-only access to documents and patients'
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You're All Set! */}
        <div className="border-l-4 border-green-500 bg-white rounded-lg p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {t('onboarding.finish.ready_title', "You're All Set!")}
              </h3>
              <p className="text-base text-gray-600 mt-1">
                {t(
                  'onboarding.finish.ready_desc',
                  'You now know all the core features of TQ. Access this tour anytime from the help icon in the top menu.'
                )}
              </p>
              <ul className="space-y-2 mt-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {t(
                      'onboarding.finish.tip_sso',
                      'Login is automatic from Hub — no extra credentials needed'
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {t(
                      'onboarding.finish.tip_support',
                      'Click the support icon for human help and AI 24/7 support — test it out!'
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Quick Actions */}
      <div className="flex flex-col">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-2">
            {t('onboarding.finish.actions_title', 'Get Started')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t('onboarding.finish.actions_desc', 'Jump to any section to start exploring:')}
          </p>

          <div className="space-y-2">
            <button
              onClick={() => onNavigate('/new-session')}
              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#B725B7] hover:bg-purple-50 transition-colors text-left group"
            >
              <Mic className="w-5 h-5 text-[#B725B7] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_new_session', 'New Session')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_new_session_desc', 'Start transcribing')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#B725B7] transition-colors flex-shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('/patients')}
              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#5ED6CE] hover:bg-teal-50 transition-colors text-left group"
            >
              <Users className="w-5 h-5 text-[#5ED6CE] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_patients', 'Patients')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_patients_desc', 'Manage patient records')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#5ED6CE] transition-colors flex-shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('/documents/quotes')}
              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group"
            >
              <FolderOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_documents', 'Documents')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_documents_desc', 'Quotes, notes, prevention, items')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('/templates')}
              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#E91E63] hover:bg-pink-50 transition-colors text-left group"
            >
              <FileText className="w-5 h-5 text-[#E91E63] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_templates', 'Templates')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_templates_desc', 'Manage document templates')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#E91E63] transition-colors flex-shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('/landing-pages/templates')}
              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#B725B7] hover:bg-purple-50 transition-colors text-left group"
            >
              <Layout className="w-5 h-5 text-[#B725B7] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_landing', 'Landing Pages')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_landing_desc', 'Public sharing pages')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#B725B7] transition-colors flex-shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('/configurations/email-template')}
              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-100 transition-colors text-left group"
            >
              <Settings className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_config', 'Configurations')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_config_desc', 'Email template settings')}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
