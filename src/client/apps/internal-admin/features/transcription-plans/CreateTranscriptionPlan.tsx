import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, Button, Input, Label, Textarea, Checkbox } from '@client/common/ui'
import { transcriptionPlansService, CreateTranscriptionPlanInput } from '../../services/transcriptionPlans'

const BASIC_LIMIT = 2400 // From TRANSCRIPTION_BASIC_MONTHLY_LIMIT

// System standard: Nova-3 with language parameter (Monolingual pricing)
const SYSTEM_STT_MODEL = 'nova-3'
const SYSTEM_COST_PER_MINUTE = 0.0043

export const CreateTranscriptionPlan: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<CreateTranscriptionPlanInput>({
    slug: '',
    name: '',
    monthlyMinutesLimit: BASIC_LIMIT,
    allowsCustomLimits: false,
    allowsOverage: false,
    sttModel: SYSTEM_STT_MODEL,
    costPerMinuteUsd: SYSTEM_COST_PER_MINUTE,
    active: true,
    description: ''
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Generate slug from name
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

  const validate = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required (generated from name)'
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens'
    }

    if (formData.monthlyMinutesLimit < BASIC_LIMIT) {
      errors.monthlyMinutesLimit = `Monthly limit cannot be below ${BASIC_LIMIT} minutes`
    }

    if (formData.costPerMinuteUsd <= 0) {
      errors.costPerMinuteUsd = 'Cost per minute must be greater than 0'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    try {
      setLoading(true)
      await transcriptionPlansService.createPlan(formData)
      navigate('/transcription-plans')
    } catch (err: any) {
      console.error('[CreateTranscriptionPlan] Failed to create plan:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Transcription Plan</h1>
        <p className="text-gray-600 mt-1">
          Create a new transcription quota plan (Basic, VIP, etc.)
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Basic Plan, VIP Plan"
                error={validationErrors.name}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Slug (Auto-generated) */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
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

            {/* Monthly Minutes Limit */}
            <div className="space-y-2">
              <Label htmlFor="monthlyMinutesLimit">
                Monthly Minutes Limit <span className="text-red-500">*</span>
              </Label>
              <Input
                id="monthlyMinutesLimit"
                type="number"
                min={BASIC_LIMIT}
                value={formData.monthlyMinutesLimit}
                onChange={(e) =>
                  setFormData({ ...formData, monthlyMinutesLimit: parseInt(e.target.value) })
                }
                error={validationErrors.monthlyMinutesLimit}
              />
              {validationErrors.monthlyMinutesLimit && (
                <p className="text-sm text-red-600">{validationErrors.monthlyMinutesLimit}</p>
              )}
              <p className="text-sm text-gray-500">
                Default monthly limit (minimum {BASIC_LIMIT} minutes / 40 hours)
              </p>
            </div>

            {/* STT Model (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="sttModel">STT Model</Label>
              <Input
                id="sttModel"
                value={`${formData.sttModel} ($${formData.costPerMinuteUsd.toFixed(4)}/min)`}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
              <p className="text-sm text-gray-500">
                Deepgram model with language targeting (pt-BR or en-US)
              </p>
            </div>

            {/* Allows Custom Limits */}
            <Checkbox
              id="allowsCustomLimits"
              checked={formData.allowsCustomLimits}
              onChange={(e) =>
                setFormData({ ...formData, allowsCustomLimits: e.target.checked })
              }
              label="Allow custom limits"
              description="If enabled, users can customize their monthly limit in Hub"
            />

            {/* Allows Overage */}
            <Checkbox
              id="allowsOverage"
              checked={formData.allowsOverage}
              onChange={(e) =>
                setFormData({ ...formData, allowsOverage: e.target.checked })
              }
              label="Allow overage"
              description="If enabled, users can enable usage beyond monthly limits in Hub"
            />

            {/* Active */}
            <Checkbox
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              label="Active"
            />

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description of the plan"
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/transcription-plans')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Plan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
