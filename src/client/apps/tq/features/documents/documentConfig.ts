import { quotesService } from '../../services/quotes'
import { clinicalNotesService } from '../../services/clinicalNotes'
import { preventionService } from '../../services/prevention'
import { getQuoteStatusOptions } from '../../types/quoteStatus'

export type DocumentType = 'quote' | 'clinical-note' | 'prevention'

export interface SelectOption {
  value: string
  label: string
}

export interface DocumentConfig {
  type: DocumentType
  hasStatus: boolean
  statusOptions?: () => SelectOption[]
  hasItems: boolean
  hasLandingPage: boolean
  hasViewPage: boolean
  backPath: string
  viewPath?: (id: string) => string
  previewPath?: (id: string, templateId: string) => string
  i18nKey: string
  // Service methods
  getById: (id: string) => Promise<any>
  update: (id: string, data: any) => Promise<any>
}

export const DOCUMENT_CONFIGS: Record<DocumentType, DocumentConfig> = {
  'quote': {
    type: 'quote',
    hasStatus: true,
    statusOptions: getQuoteStatusOptions,
    hasItems: true,
    hasLandingPage: true,
    hasViewPage: false,
    backPath: '/documents/quotes',
    previewPath: (id, templateId) => `/quotes/${id}/preview-public-quote/${templateId}`,
    i18nKey: 'quotes',
    getById: (id) => quotesService.getQuote(id),
    update: (id, data) => quotesService.updateQuote(id, data)
  },
  'clinical-note': {
    type: 'clinical-note',
    hasStatus: false,
    hasItems: false,
    hasLandingPage: false,
    hasViewPage: true,
    backPath: '/documents/clinical-notes',
    viewPath: (id) => `/documents/clinical-note/${id}/view`,
    i18nKey: 'clinical_notes',
    getById: (id) => clinicalNotesService.getById(id),
    update: (id, data) => clinicalNotesService.update(id, data)
  },
  'prevention': {
    type: 'prevention',
    hasStatus: false,
    hasItems: false,
    hasLandingPage: true,
    hasViewPage: true,
    backPath: '/documents/prevention',
    viewPath: (id) => `/documents/prevention/${id}/view`,
    i18nKey: 'prevention',
    getById: (id) => preventionService.getById(id),
    update: (id, data) => preventionService.update(id, data)
  }
}

// Helper to get config from URL param
export const getDocumentConfig = (documentType: string): DocumentConfig | null => {
  return DOCUMENT_CONFIGS[documentType as DocumentType] || null
}

// Common document interface for type-safe access
export interface DocumentData {
  id: string
  number: string
  content: string
  status?: string
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  createdBy?: {
    firstName?: string
    lastName?: string
  }
  // Patient fields
  patient_id?: string
  patient_first_name?: string
  patient_last_name?: string
  patient_email?: string
  patient_phone?: string
  // Session fields
  session_number?: string
  session_status?: string
  // Quote specific
  items?: any[]
  total?: number
}
