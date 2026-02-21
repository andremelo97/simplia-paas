import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Puck } from '@measured/puck'
import '@measured/puck/puck.css'
import { Button } from '@client/common/ui'
import { X, Eye, Save, Check, AlertCircle, Loader2 } from 'lucide-react'
import { landingPagesService } from '../../services/landingPages'
import { brandingService, BrandingData } from '../../services/branding'
import { createConfig } from './puck-config'
import { useAuthStore } from '../../shared/store'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export const DesignLandingPageTemplate: React.FC = () => {
  const { t } = useTranslation('tq')
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const canEdit = user?.role !== 'operations'
  const [template, setTemplate] = useState<any>(null)
  const [data, setData] = useState<any>({ content: [], root: {} })
  const [isSaving, setIsSaving] = useState(false)
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [config, setConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSavedData, setLastSavedData] = useState<string>('')
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const handleSaveRef = useRef<() => void>(() => {})
  const initialLoadRef = useRef(true)
  const isClosingRef = useRef(false)

  // Keep ref updated with latest handleSave
  useEffect(() => {
    handleSaveRef.current = () => handleSave(false)
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (canEdit && !isSaving) {
          handleSaveRef.current()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canEdit, isSaving])

  useEffect(() => {
    loadBrandingAndTemplate()
  }, [id])

  const loadBrandingAndTemplate = async () => {
    setIsLoading(true)
    try {
      // Load branding first
      const brandingData = await brandingService.getBranding()
      setBranding(brandingData)

      // Create config with branding
      const puckConfig = createConfig(brandingData)
      setConfig(puckConfig)

      // Then load template
      await loadTemplate()
    } catch (error) {
      // Failed to load branding
    } finally {
      setIsLoading(false)
    }
  }

  const loadTemplate = async () => {
    if (!id) return
    try {
      const fetchedTemplate = await landingPagesService.getTemplate(id)
      setTemplate(fetchedTemplate)

      // Load existing content or initialize empty
      const initialData = fetchedTemplate.content && Object.keys(fetchedTemplate.content).length > 0
        ? fetchedTemplate.content
        : { content: [], root: {} }

      setData(initialData)
      setLastSavedData(JSON.stringify(initialData))
      setHasUnsavedChanges(false)
    } catch (error) {
      // Failed to load template
    }
  }

  // Check for unsaved changes
  const checkUnsavedChanges = useCallback((newData: any) => {
    const newDataStr = JSON.stringify(newData)
    const hasChanges = newDataStr !== lastSavedData
    setHasUnsavedChanges(hasChanges)
    return hasChanges
  }, [lastSavedData])

  // Auto-save after 30 seconds of inactivity
  const scheduleAutoSave = useCallback(() => {
    if (!canEdit) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (hasUnsavedChanges && !isSaving) {
        handleSave(true)
      }
    }, 30000) // 30 seconds
  }, [canEdit, hasUnsavedChanges, isSaving])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current)
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    }
  }, [])

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isClosingRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleSave = async (isAutoSave = false) => {
    if (!id || isSaving) return

    // Clear any existing status timeout
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current)
    }

    setIsSaving(true)
    setSaveStatus('saving')

    try {
      const updatedTemplate = await landingPagesService.updateTemplate(id, {
        content: data
      })
      // Update template state to reflect saved changes
      setTemplate(updatedTemplate)
      setLastSavedData(JSON.stringify(data))
      setHasUnsavedChanges(false)
      setSaveStatus('saved')

      // Reset status after 3 seconds
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (error) {
      setSaveStatus('error')

      // Reset error status after 5 seconds
      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
      }, 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(t('landing_pages.unsaved_changes_confirm'))
      if (!confirmLeave) return
    }
    isClosingRef.current = true
    window.close()
  }

  const handlePreview = () => {
    if (!id) return
    window.open(`/landing-pages/templates/${id}/preview`, '_blank')
  }

  const handleDataChange = (updatedData: any) => {
    setData(updatedData)
    // Skip first onChange from Puck (editor initialization) to avoid false positive
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      setLastSavedData(JSON.stringify(updatedData))
      return
    }
    checkUnsavedChanges(updatedData)
    scheduleAutoSave()
  }

  const hasContent = data?.content && Array.isArray(data.content) && data.content.length > 0

  // Render save button with status
  const renderSaveButton = () => {
    const getButtonContent = () => {
      switch (saveStatus) {
        case 'saving':
          return (
            <>
              <Loader2 size={16} className="animate-spin" />
              {t('landing_pages.saving_layout')}
            </>
          )
        case 'saved':
          return (
            <>
              <Check size={16} className="text-green-500" />
              {t('landing_pages.layout_saved')}
            </>
          )
        case 'error':
          return (
            <>
              <AlertCircle size={16} className="text-red-500" />
              {t('landing_pages.save_error')}
            </>
          )
        default:
          return (
            <>
              <Save size={16} />
              {t('landing_pages.save_layout')}
              {hasUnsavedChanges && (
                <span className="w-2 h-2 bg-orange-500 rounded-full ml-1" title={t('landing_pages.unsaved_changes')} />
              )}
            </>
          )
      }
    }

    const getButtonVariant = () => {
      if (saveStatus === 'saved') return 'default'
      if (saveStatus === 'error') return 'danger'
      return 'default'
    }

    return (
      <Button
        type="button"
        variant={getButtonVariant() as any}
        onClick={() => handleSave(false)}
        disabled={isSaving || saveStatus === 'saved'}
        className={`flex items-center gap-2 transition-all ${
          saveStatus === 'saved' ? 'bg-green-50 border-green-200 text-green-700' : ''
        } ${
          saveStatus === 'error' ? 'bg-red-50 border-red-200 text-red-700' : ''
        }`}
      >
        {getButtonContent()}
      </Button>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary-500" />
          <div className="text-gray-500">{t('landing_pages.loading_template')}</div>
        </div>
      </div>
    )
  }

  if (!template || !config || !branding) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">{t('landing_pages.template_not_found')}</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Puck Editor - Always fullscreen */}
      <div className="h-screen">
        <Puck
          config={config}
          data={data}
          onChange={handleDataChange}
          onPublish={(publishedData: any) => {
            setData(publishedData)
          }}
          iframe={{
            enabled: true,
          }}
          overrides={{
            headerActions: () => (
              <div className="flex items-center gap-2">
                {canEdit && renderSaveButton()}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={!hasContent}
                  className="flex items-center gap-2"
                >
                  <Eye size={16} />
                  {t('landing_pages.preview')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  className="flex items-center gap-2"
                >
                  <X size={16} />
                  {t('common.close')}
                </Button>
              </div>
            ),
          }}
        />
      </div>
    </div>
  )
}
