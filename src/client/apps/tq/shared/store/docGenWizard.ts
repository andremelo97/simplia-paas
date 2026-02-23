import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TranscriptionStatus = 'idle' | 'recording' | 'uploading' | 'processing' | 'completed' | 'error'
export type WizardDocumentType = 'quote' | 'clinical-note' | 'prevention'

export interface CreatedDocument {
  id: string
  number: string
  type: WizardDocumentType
}

export interface ExistingSessionData {
  id: string
  number: string
  patientId: string
  patientName: string
  transcriptionId?: string | null
  transcriptionText?: string | null
}

interface DocGenWizardStore {
  // UI State
  isOpen: boolean
  showResumeHint: boolean
  currentStep: number
  isNewSession: boolean

  // Step 1: Audio & Patient
  transcriptionId: string | null
  transcriptionStatus: TranscriptionStatus
  transcriptionText: string | null
  patientId: string | null
  patientName: string | null
  sessionId: string | null
  sessionNumber: string | null

  // Step 2: Template & Doc Type
  selectedTemplateId: string | null
  selectedTemplateName: string | null
  documentType: WizardDocumentType | null

  // Step 3: Created document
  documentId: string | null
  documentNumber: string | null
  documentContent: string | null

  // Step 4: All documents created in this session
  createdDocuments: CreatedDocument[]

  // Actions
  openWizard: () => void
  closeWizard: () => void
  minimizeWizard: () => void
  hideResumeHint: () => void
  setStep: (step: number) => void

  // Step 0 actions
  selectExistingSession: (session: ExistingSessionData) => void
  startNewSession: () => void

  // Data setters
  setTranscription: (id: string, text: string) => void
  setTranscriptionStatus: (status: TranscriptionStatus) => void
  setTranscriptionText: (text: string) => void
  setPatient: (id: string, name: string) => void
  setSession: (id: string, number: string) => void
  setTemplate: (id: string, name: string) => void
  setDocumentType: (type: WizardDocumentType) => void
  setDocument: (id: string, number: string, content: string) => void
  setDocumentContent: (content: string) => void
  addCreatedDocument: (doc: CreatedDocument) => void
  loopToStep2: () => void
  resetStep1: () => void
  resetWizard: () => void
}

const initialState = {
  isOpen: false,
  showResumeHint: false,
  currentStep: 0,
  isNewSession: false,
  transcriptionId: null as string | null,
  transcriptionStatus: 'idle' as TranscriptionStatus,
  transcriptionText: null as string | null,
  patientId: null as string | null,
  patientName: null as string | null,
  sessionId: null as string | null,
  sessionNumber: null as string | null,
  selectedTemplateId: null as string | null,
  selectedTemplateName: null as string | null,
  documentType: null as WizardDocumentType | null,
  documentId: null as string | null,
  documentNumber: null as string | null,
  documentContent: null as string | null,
  createdDocuments: [] as CreatedDocument[],
}

export const useDocGenWizardStore = create<DocGenWizardStore>()(
  persist(
    (set) => ({
      ...initialState,

      openWizard: () => set({ isOpen: true, showResumeHint: false }),
      closeWizard: () => set({ ...initialState }),
      minimizeWizard: () => set({ isOpen: false, showResumeHint: true }),
      hideResumeHint: () => set({ ...initialState }),
      setStep: (step: number) => set({ currentStep: step }),

      // Step 0: Select existing session → skip to step 2 (template)
      selectExistingSession: (session) => set({
        isNewSession: false,
        sessionId: session.id,
        sessionNumber: session.number,
        patientId: session.patientId,
        patientName: session.patientName,
        transcriptionId: session.transcriptionId || null,
        transcriptionText: session.transcriptionText || null,
        transcriptionStatus: session.transcriptionId ? 'completed' as TranscriptionStatus : 'idle' as TranscriptionStatus,
        currentStep: 2,
      }),

      // Step 0: Create new session → go to step 1 (audio/patient)
      startNewSession: () => set({
        isNewSession: true,
        currentStep: 1,
      }),

      setTranscription: (id, text) => set({
        transcriptionId: id,
        transcriptionText: text,
        transcriptionStatus: 'completed',
      }),
      setTranscriptionStatus: (status) => set({ transcriptionStatus: status }),
      setTranscriptionText: (text) => set({ transcriptionText: text }),
      setPatient: (id, name) => set({ patientId: id, patientName: name }),
      setSession: (id, number) => set({ sessionId: id, sessionNumber: number }),
      setTemplate: (id, name) => set({ selectedTemplateId: id, selectedTemplateName: name }),
      setDocumentType: (type) => set({ documentType: type }),
      setDocument: (id, number, content) => set({
        documentId: id,
        documentNumber: number,
        documentContent: content,
      }),
      setDocumentContent: (content) => set({ documentContent: content }),
      addCreatedDocument: (doc) => set((state) => ({
        createdDocuments: [...state.createdDocuments, doc],
      })),
      // Loop back to template step (index 2)
      loopToStep2: () => set({
        currentStep: 2,
        selectedTemplateId: null,
        selectedTemplateName: null,
        documentType: null,
        documentId: null,
        documentNumber: null,
        documentContent: null,
      }),
      // Reset audio/patient step data (back to step 0)
      resetStep1: () => set({
        currentStep: 0,
        isNewSession: false,
        transcriptionId: null,
        transcriptionStatus: 'idle' as TranscriptionStatus,
        transcriptionText: null,
        patientId: null,
        patientName: null,
        sessionId: null,
        sessionNumber: null,
        selectedTemplateId: null,
        selectedTemplateName: null,
        documentType: null,
        documentId: null,
        documentNumber: null,
        documentContent: null,
        createdDocuments: [],
      }),
      resetWizard: () => set({ ...initialState }),
    }),
    {
      name: 'tq-doc-gen-wizard',
      partialize: (state) => ({
        currentStep: state.currentStep,
        isNewSession: state.isNewSession,
        transcriptionId: state.transcriptionId,
        transcriptionText: state.transcriptionText,
        transcriptionStatus: state.transcriptionStatus === 'completed' ? 'completed' as const : 'idle' as const,
        patientId: state.patientId,
        patientName: state.patientName,
        sessionId: state.sessionId,
        sessionNumber: state.sessionNumber,
        selectedTemplateId: state.selectedTemplateId,
        selectedTemplateName: state.selectedTemplateName,
        documentType: state.documentType,
        documentId: state.documentId,
        documentNumber: state.documentNumber,
        documentContent: state.documentContent,
        createdDocuments: state.createdDocuments,
      }),
    }
  )
)
