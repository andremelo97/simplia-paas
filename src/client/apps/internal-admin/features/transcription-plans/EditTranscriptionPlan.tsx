import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, Button, Input, Label, Textarea, Checkbox } from '@client/common/ui'
import {
  transcriptionPlansService,
  TranscriptionPlan,
  UpdateTranscriptionPlanInput
} from '../../services/transcriptionPlans'

// System standard: Nova-3 model with two pricing strategies
const STT_MODEL_OPTIONS = [
  {
    value: 'nova-3-monolingual',
    label: 'Nova-3 Monolingual (pt-BR/en-US targeting)',
    cost: 0.0043,
    languageDetection: false
  },
  {
    value: 'nova-3-multilingual',
    label: 'Nova-3 Multilingual (auto-detect 16 languages)',
    cost: 0.0052,
    languageDetection: true
  }
]

export const EditTranscriptionPlan: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [plan, setPlan] = useState<TranscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateTranscriptionPlanInput>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true)
        const data = await transcriptionPlansService.getPlanById(parseInt(id!))
        setPlan(data)
        setFormData({
          name: data.name,
          monthlyMinutesLimit: data.monthlyMinutesLimit,
          allowsCustomLimits: data.allowsCustomLimits,
          allowsOverage: data.allowsOverage,
          languageDetectionEnabled: data.languageDetectionEnabled,
          costPerMinuteUsd: data.costPerMinuteUsd,
          active: data.active,
          description: data.description || ''
        })
      } catch (err: any) {
        console.error('[EditTranscriptionPlan] Failed to load plan:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPlan()
  }, [id])

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setFormData({
      ...formData,
      name: newName,
      slug: generateSlug(newName)
    })
  }

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOption = STT_MODEL_OPTIONS.find(opt => opt.value === e.target.value)
    if (selectedOption) {
      setFormData({
        ...formData,
        sttModel: 'nova-3', // Always store 'nova-3' in DB
        languageDetectionEnabled: selectedOption.languageDetection,
        costPerMinuteUsd: selectedOption.cost
      })
    }
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (formData.name && !formData.name.trim()) {
      errors.name = 'Name cannot be empty'
    }

    if (formData.costPerMinuteUsd && formData.costPerMinuteUsd <= 0) {
      errors.costPerMinuteUsd = 'Cost per minute must be greater than 0'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setSaving(true)
      await transcriptionPlansService.updatePlan(parseInt(id!), formData)
      navigate('/transcription-plans')
    } catch (err: any) {
      console.error('[EditTranscriptionPlan] Failed to update plan:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Plan not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Transcription Plan</h1>
        <p className="text-gray-600 mt-1">Editing: {plan.name} ({plan.slug})</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                error={validationErrors.name}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
              <Input
                id="slug"
                value={formData.slug || plan.slug}
                disabled
                className="bg-gray-50 cursor-not-allowed"
                error={validationErrors.slug}
              />
              {validationErrors.slug && (
                <p className="text-sm text-red-600">{validationErrors.slug}</p>
              )}
              <p className="text-sm text-gray-500">
                Auto-generated from name (unique identifier)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyMinutesLimit">Monthly Minutes Limit</Label>
              <Input
                id="monthlyMinutesLimit"
                type="number"
                min={1}
                value={formData.monthlyMinutesLimit}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyMinutesLimit: parseInt(e.target.value) })
                }
                error={validationErrors.monthlyMinutesLimit}
              />
              {validationErrors.monthlyMinutesLimit && (
                <p className="text-sm text-red-600">{validationErrors.monthlyMinutesLimit}</p>
              )}
              <p className="text-sm text-gray-500">Monthly limit in minutes (e.g., 2400 = 40 hours)</p>
            </div>

            {/* STT Model & Language Strategy */}
            <div className="space-y-2">
              <Label htmlFor="sttModel">
                STT Model & Language Strategy <span className="text-red-500">*</span>
              </Label>
              <select
                id="sttModel"
                value={formData.languageDetectionEnabled ? 'nova-3-multilingual' : 'nova-3-monolingual'}
                onChange={handleModelChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#B725B7] focus:border-transparent"
              >
                {STT_MODEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - ${option.cost.toFixed(4)}/min
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500">
                {formData.languageDetectionEnabled
                  ? '🌍 Multilingual: Automatically detects language from audio (16 languages supported)'
                  : '🎯 Monolingual: Uses targeted language parameter (pt-BR or en-US)'}
              </p>
            </div>

            <Checkbox
              id="allowsCustomLimits"
              checked={formData.allowsCustomLimits}
              onChange={(e) =>
                setFormData({ ...formData, allowsCustomLimits: e.target.checked })
              }
              label="Allow custom limits"
              description="If enabled, users can customize their monthly limit in Hub"
            />

            <Checkbox
              id="allowsOverage"
              checked={formData.allowsOverage}
              onChange={(e) =>
                setFormData({ ...formData, allowsOverage: e.target.checked })
              }
              label="Allow overage"
              description="If enabled, users can enable usage beyond monthly limits in Hub"
            />

            <Checkbox
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              label="Active"
            />

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/transcription-plans')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
