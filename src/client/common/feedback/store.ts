import { create } from 'zustand'
import { AppFeedback } from './types'

interface FeedbackState {
  feedbacks: AppFeedback[]
  enqueue: (feedback: Omit<AppFeedback, 'id' | 'timestamp'>) => void
  dequeue: (id: string) => void
  clear: () => void
  clearByKind: (kind: AppFeedback['kind']) => void
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedbacks: [],

  enqueue: (feedback) => {
    const now = Date.now()
    const DEDUP_WINDOW = 5000 // 5 seconds deduplication window

    // Check for duplicate feedback within deduplication window
    const existingFeedback = get().feedbacks.find(f => 
      f.code === feedback.code && 
      f.kind === feedback.kind &&
      (now - f.timestamp) < DEDUP_WINDOW
    )

    // Skip if duplicate found within window
    if (existingFeedback) {
      console.log(`[FeedbackStore] Skipping duplicate feedback: ${feedback.code}`)
      return
    }

    const newFeedback: AppFeedback = {
      ...feedback,
      id: `feedback-${now}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      duration: feedback.duration || (feedback.kind === 'error' ? 0 : 4000) // Errors persist, others auto-dismiss
    }

    set(state => ({
      feedbacks: [...state.feedbacks, newFeedback]
    }))

    // Auto-dismiss non-error feedbacks
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
  }
}))

// Helper function to publish feedback from anywhere
export const publishFeedback = (feedback: Omit<AppFeedback, 'id' | 'timestamp'>) => {
  useFeedbackStore.getState().enqueue(feedback)
}
