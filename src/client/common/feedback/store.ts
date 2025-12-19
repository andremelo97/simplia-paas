import { create } from 'zustand'
import { AppFeedback } from './types'

interface FeedbackState {
  feedbacks: AppFeedback[]
  suppressedCodes: Set<string>
  enqueue: (feedback: Omit<AppFeedback, 'id' | 'timestamp'>) => void
  dequeue: (id: string) => void
  clear: () => void
  clearByKind: (kind: AppFeedback['kind']) => void
  suppressCode: (code: string) => void
  unsuppressCode: (code: string) => void
  clearSuppressed: () => void
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedbacks: [],
  suppressedCodes: new Set(),

  enqueue: (feedback) => {
    const now = Date.now()
    const DEDUP_WINDOW = 5000 // 5 seconds deduplication window
    const { suppressedCodes } = get()

    // Skip if this code is currently suppressed
    if (suppressedCodes.has(feedback.code)) {
      return
    }

    // Check for duplicate feedback within deduplication window
    const existingFeedback = get().feedbacks.find(f =>
      f.code === feedback.code &&
      f.kind === feedback.kind &&
      (now - f.timestamp) < DEDUP_WINDOW
    )

    // Skip if duplicate found within window
    if (existingFeedback) {
      return
    }

    const newFeedback: AppFeedback = {
      ...feedback,
      id: `feedback-${now}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      duration: feedback.duration || (feedback.kind === 'error' ? 10000 : 4000) // Errors dismiss after 10s, others after 4s
    }

    set(state => ({
      feedbacks: [...state.feedbacks, newFeedback]
    }))

    // Auto-dismiss all feedbacks with duration > 0
    if (newFeedback.duration && newFeedback.duration > 0) {
      setTimeout(() => {
        get().dequeue(newFeedback.id)
      }, newFeedback.duration)
    }

    // Emit telemetry
    if (typeof window !== 'undefined' && (window as any).analytics?.track) {
      (window as any).analytics.track('feedback_shown', {
        kind: newFeedback.kind,
        code: newFeedback.code,
        path: newFeedback.path
      })
    }
  },

  dequeue: (id) => {
    set(state => ({
      feedbacks: state.feedbacks.filter(f => f.id !== id)
    }))
  },

  clear: () => {
    set({ feedbacks: [] })
  },

  clearByKind: (kind) => {
    set(state => ({
      feedbacks: state.feedbacks.filter(f => f.kind !== kind)
    }))
  },

  suppressCode: (code) => {
    set(state => ({
      suppressedCodes: new Set([...state.suppressedCodes, code])
    }))
  },

  unsuppressCode: (code) => {
    set(state => {
      const newSuppressedCodes = new Set(state.suppressedCodes)
      newSuppressedCodes.delete(code)
      return { suppressedCodes: newSuppressedCodes }
    })
  },

  clearSuppressed: () => {
    set({ suppressedCodes: new Set() })
  }
}))

// Helper function to publish feedback from anywhere
export const publishFeedback = (feedback: Omit<AppFeedback, 'id' | 'timestamp'>) => {
  useFeedbackStore.getState().enqueue(feedback)
}

// Helper functions for suppressing feedback codes
export const suppressFeedbackCode = (code: string) => {
  useFeedbackStore.getState().suppressCode(code)
}

export const unsuppressFeedbackCode = (code: string) => {
  useFeedbackStore.getState().unsuppressCode(code)
}

export const clearSuppressedFeedback = () => {
  useFeedbackStore.getState().clearSuppressed()
}

// Utility to temporarily suppress feedback codes during a batch operation
export const withSuppressedFeedback = async <T>(
  codes: string[],
  operation: () => Promise<T>
): Promise<T> => {
  try {
    // Suppress the codes
    codes.forEach(code => suppressFeedbackCode(code))
    
    // Execute the operation
    const result = await operation()
    
    return result
  } finally {
    // Always unsuppress the codes
    codes.forEach(code => unsuppressFeedbackCode(code))
  }
}
