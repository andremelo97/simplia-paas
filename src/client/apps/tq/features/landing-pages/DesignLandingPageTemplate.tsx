import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Puck } from '@measured/puck'
import '@measured/puck/puck.css'
import { Button, Tooltip } from '@client/common/ui'
import { X, Eye, Save, Check, AlertCircle, Loader2, HelpCircle } from 'lucide-react'
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
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [config, setConfig] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  // Refs to avoid stale closures in auto-save
  const dataRef = useRef<any>({ content: [], root: {} })
  const lastSavedDataRef = useRef<string>('')
  const isSavingRef = useRef(false)
  const performSaveRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const saveStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const initialLoadRef = useRef(true)
  const isClosingRef = useRef(false)

  // Keep data ref in sync
  useEffect(() => { dataRef.current = data }, [data])

  // Keyboard shortcuts — uses ref so never stale
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (canEdit) performSaveRef.current()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canEdit])

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
      dataRef.current = initialData
      lastSavedDataRef.current = JSON.stringify(initialData)
      setHasUnsavedChanges(false)
    } catch (error) {
      // Failed to load template
    }
  }

  // Schedule auto-save: debounce 3s after last change — uses ref so never stale
  const scheduleAutoSave = useCallback(() => {
    if (!canEdit || !id) return
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performSaveRef.current()
    }, 3000)
  }, [canEdit, id])

  // Core save function — uses refs to always read latest data
  const performSave = async () => {
    if (!id || isSavingRef.current) return

    const currentData = dataRef.current
    const currentDataStr = JSON.stringify(currentData)

    // Nothing to save — still flash "Saved!" so user gets feedback
    if (currentDataStr === lastSavedDataRef.current) {
      if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current)
      setSaveStatus('saved')
      saveStatusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
      return
    }

    if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current)

    isSavingRef.current = true
    setSaveStatus('saving')

    try {
      const updatedTemplate = await landingPagesService.updateTemplate(id, {
        content: currentData,
      })
      setTemplate(updatedTemplate)
      lastSavedDataRef.current = currentDataStr
      setHasUnsavedChanges(false)
      setSaveStatus('saved')

      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (error) {
      setSaveStatus('error')

      saveStatusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle')
      }, 5000)
    } finally {
      isSavingRef.current = false

      // If data changed while saving, schedule another save
      if (JSON.stringify(dataRef.current) !== lastSavedDataRef.current) {
        setHasUnsavedChanges(true)
        scheduleAutoSave()
      }
    }
  }

  // Keep performSave ref always up-to-date
  useEffect(() => { performSaveRef.current = performSave })

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
    // Skip first onChange from Puck (editor initialization)
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      lastSavedDataRef.current = JSON.stringify(updatedData)
      return
    }
    const hasChanges = JSON.stringify(updatedData) !== lastSavedDataRef.current
    setHasUnsavedChanges(hasChanges)
    if (hasChanges) scheduleAutoSave()
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
        onClick={() => performSaveRef.current()}
        disabled={saveStatus === 'saving' || saveStatus === 'saved'}
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
      {/* Help Video Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setIsHelpOpen(false)}>
          <div className="relative w-full max-w-3xl mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg"
                src="https://www.youtube.com/embed/YOUTUBE_VIDEO_ID?autoplay=1&rel=0"
                title={t('landing_pages.help_video_title', 'Landing Page Editor Tutorial')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

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
                <Tooltip content={t('landing_pages.help_video_tooltip', 'How to use the editor')} side="bottom">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsHelpOpen(true)}
                    className="text-gray-500 hover:text-[#B725B7] transition-colors"
                  >
                    <HelpCircle size={18} />
                  </Button>
                </Tooltip>
                {canEdit && renderSaveButton()}
                <Button
                  type="button"
                  variant="tertiary"
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
