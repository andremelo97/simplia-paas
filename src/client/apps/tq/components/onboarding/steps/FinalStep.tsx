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
  KeyRound,
  Bot,
  Mic,
  FolderOpen,
  FileText,
  Layout,
  Settings,
} from 'lucide-react'

export const FinalStep: React.FC = () => {
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
                      'Click the support icon in the top menu for human help'
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {t(
                      'onboarding.finish.tip_password',
                      'Change your temporary password — click the key icon in the sidebar'
                    )}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#5ED6CE] flex-shrink-0" />
                  <span className="text-sm text-gray-600">
                    {t(
                      'onboarding.finish.tip_ai',
                      'AI 24/7 support is available inside TQ — test it out!'
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Quick Reference */}
      <div className="flex flex-col">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold text-lg text-gray-900 mb-4">
            {t('onboarding.finish.reference_title', 'Quick Reference')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t(
              'onboarding.finish.reference_desc',
              'Where to find everything in the sidebar:'
            )}
          </p>

          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <Mic className="w-5 h-5 text-[#B725B7] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_new_session', 'New Session')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_new_session_desc', 'Start transcribing')}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <Mic className="w-5 h-5 text-[#B725B7] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_sessions', 'Sessions')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_sessions_desc', 'View past recordings')}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <Users className="w-5 h-5 text-[#5ED6CE] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_patients', 'Patients')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_patients_desc', 'Manage patient records')}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_documents', 'Documents')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_documents_desc', 'Quotes, notes, prevention, items')}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#E91E63] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_templates', 'Templates')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_templates_desc', 'Manage document templates')}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <Layout className="w-5 h-5 text-[#B725B7] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_landing', 'Landing Pages')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_landing_desc', 'Public sharing pages')}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t('onboarding.finish.ref_config', 'Configurations')}
                </p>
                <p className="text-xs text-gray-500">
                  {t('onboarding.finish.ref_config_desc', 'Email template settings')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
