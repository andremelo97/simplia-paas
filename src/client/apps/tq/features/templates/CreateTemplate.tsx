import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Input,
  TemplateEditor,
  Checkbox
} from '@client/common/ui'
import { templatesService, CreateTemplateRequest } from '../../services/templates'

interface TemplateFormData {
  title: string
  content: string
  description: string
  active: boolean
}

const INITIAL_FORM_DATA: TemplateFormData = {
  title: '',
  content: '',
  description: '',
  active: true
}

export const CreateTemplate: React.FC = () => {
  const { t } = useTranslation('tq')
  const [formData, setFormData] = useState<TemplateFormData>(INITIAL_FORM_DATA)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVariables, setShowVariables] = useState(false)

  const navigate = useNavigate()

  const handleInputChange = (field: keyof TemplateFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content
    }))

    // Clear validation error when user starts typing
    if (validationErrors.content) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.content
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) {
      errors.title = t('templates.validation.title_required')
    } else if (formData.title.trim().length < 3) {
      errors.title = t('templates.validation.title_min')
    }

    if (!formData.content.trim() || formData.content.trim() === '<p></p>') {
      errors.content = t('templates.validation_errors.content')
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const requestData: CreateTemplateRequest = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        description: formData.description.trim() || undefined,
        active: formData.active
      }

      await templatesService.create(requestData)
      navigate('/templates')
    } catch (error: any) {
      // Error is handled by HTTP interceptor
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/templates')
  }

  return (
    <div className="space-y-6">
      <div className="sm:sticky sm:top-0 sm:z-10 sm:bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('templates.create')}</h1>
          <p className="text-gray-600 mt-1">
            {t('templates.create_subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            type="submit"
            form="createTemplateForm"
            variant="default"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('templates.creating_template') : t('templates.create')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8">
        {/* Main Form - 60% */}
        <div className="lg:col-span-3">
          <form id="createTemplateForm" onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Template Information */}
              <Card>
                <CardHeader className="p-6 pb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t('templates.template_information')}</h2>
                </CardHeader>

                <CardContent className="space-y-6 px-6 pb-6">
                  <div className="space-y-6">
                    <Input
                      label={t('templates.title')}
                      value={formData.title}
                      onChange={handleInputChange('title')}
                      error={validationErrors.title}
                      placeholder={t('templates.placeholders.title')}
                      helperText={t('templates.helper.title')}
                      required
                      disabled={isSubmitting}
                    />

                    <Input
                      label={t('templates.description')}
                      value={formData.description}
                      onChange={handleInputChange('description')}
                      placeholder={t('templates.placeholders.description')}
                      helperText={t('templates.helper.description')}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('templates.template_content')} *
                    </label>
                    <TemplateEditor
                      content={formData.content}
                      onChange={handleContentChange}
                      placeholder={t('templates.placeholders.content')}
                      readonly={isSubmitting}
                    />
                    {validationErrors.content && (
                      <p className="text-sm text-red-600 mt-1">{t('templates.validation_errors.content')}</p>
                    )}
                  </div>

                  <div>
                    <Checkbox
                      label={t('templates.active_checkbox')}
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      disabled={isSubmitting}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

          </form>
        </div>

        {/* Template Creation Guide - 40% */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-6">
            <CardHeader className="p-6 pb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('templates.guide.title')}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('templates.guide.subtitle')}
              </p>
            </CardHeader>

            <CardContent className="px-6 pb-6 space-y-6">
              {/* Placeholders */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('templates.guide.placeholders_title')}</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                  <code className="text-sm text-blue-800 font-mono">[placeholder]</code>
                </div>
                <p className="text-xs text-gray-600">
                  {t('templates.guide.placeholders_description')}
                </p>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('templates.guide.instructions_title')}</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                  <code className="text-sm text-amber-800 font-mono">(instruction)</code>
                </div>
                <p className="text-xs text-gray-600">
                  {t('templates.guide.instructions_description')}
                </p>
              </div>

              {/* System Variables */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('templates.guide.variables_title')}</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                  <code className="text-sm text-green-800 font-mono">$variable$</code>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  {t('templates.guide.variables_description')}
                </p>

                <button
                  type="button"
                  onClick={() => setShowVariables(!showVariables)}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
                >
                  {showVariables ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {t('templates.guide.click_to_see_variables')}
                </button>

                {showVariables && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="space-y-2 text-xs">
                      <div><code className="font-mono text-green-700">$patient.first_name$</code> - Patient's first name</div>
                      <div><code className="font-mono text-green-700">$patient.last_name$</code> - Patient's last name</div>
                      <div><code className="font-mono text-green-700">$patient.fullName$</code> - Patient's full name (first + last)</div>
                      <div><code className="font-mono text-green-700">$date.now$</code> - Current date</div>
                      <div><code className="font-mono text-green-700">$session.created_at$</code> - Session creation date</div>
                      <div><code className="font-mono text-green-700">$me.first_name$</code> - Your first name</div>
                      <div><code className="font-mono text-green-700">$me.last_name$</code> - Your last name</div>
                      <div><code className="font-mono text-green-700">$me.fullName$</code> - Your full name (first + last)</div>
                      <div><code className="font-mono text-green-700">$me.clinic$</code> - Your clinic name</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Example */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('templates.guide.example_title')}</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <code className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
{t('templates.guide.example_content')}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}