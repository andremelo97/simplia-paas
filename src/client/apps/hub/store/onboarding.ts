import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingStore {
  isWizardOpen: boolean
  wasSkipped: boolean
  showResumeHint: boolean
  currentStep: number
  isSaving: boolean
  openWizard: () => void
  closeWizard: () => void
  closeWizardForNavigation: () => void
  skipWizard: () => void
  hideResumeHint: () => void
  setCurrentStep: (step: number) => void
  setSaving: (saving: boolean) => void
  resetOnboarding: () => void
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      isWizardOpen: false,
      wasSkipped: false,
      showResumeHint: false,
      currentStep: 0,
      isSaving: false,
      openWizard: () => set({ isWizardOpen: true, showResumeHint: false }),
      closeWizard: () => set({ isWizardOpen: false, showResumeHint: false, currentStep: 0 }),
      closeWizardForNavigation: () => set({ isWizardOpen: false, showResumeHint: true }),
      skipWizard: () => set({ isWizardOpen: false, wasSkipped: true, showResumeHint: false, currentStep: 0 }),
      hideResumeHint: () => set({ showResumeHint: false }),
      setCurrentStep: (step: number) => set({ currentStep: step }),
      setSaving: (saving: boolean) => set({ isSaving: saving }),
      resetOnboarding: () => set({ isWizardOpen: false, wasSkipped: false, showResumeHint: false, currentStep: 0, isSaving: false }),
    }),
    {
      name: 'hub-onboarding',
      partialize: (state) => ({ wasSkipped: state.wasSkipped, currentStep: state.currentStep }),
    }
  )
)
