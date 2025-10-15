/**
 * Currency Formatter Hook
 *
 * Automatically formats currency based on tenant locale
 * - Brazil (pt-BR) → BRL (R$)
 * - All others (en-US) → USD ($)
 */

import { useMemo, useSyncExternalStore } from 'react'

interface CurrencyFormatterHook {
  formatCurrency: (amount: number | string) => string
  getCurrency: () => string
  getCurrencySymbol: () => string
}

/**
 * Hook to format currency based on tenant locale
 * Uses useSyncExternalStore to subscribe to localStorage changes
 * Works in both TQ and Hub apps
 */
export function useCurrencyFormatter(): CurrencyFormatterHook {
  // Subscribe to localStorage changes for reactive updates
  const tenantLocale = useSyncExternalStore(
    // Subscribe function - called when component mounts
    (callback) => {
      // Listen for storage events (from other tabs)
      window.addEventListener('storage', callback)

      // Return cleanup function
      return () => {
        window.removeEventListener('storage', callback)
      }
    },
    // Get snapshot function - returns current value
    () => {
      try {
        const authStorage = localStorage.getItem('auth-storage')
        if (authStorage) {
          const parsed = JSON.parse(authStorage)
          return parsed.state?.tenantLocale || null
        }
      } catch (e) {
        console.warn('⚠️ [useCurrencyFormatter] Failed to read from localStorage:', e)
      }
      return null
    },
    // Server snapshot (for SSR) - return null
    () => null
  )

  const { locale, currency, currencySymbol } = useMemo(() => {
    // Default to en-US if no locale detected
    const effectiveLocale = tenantLocale || 'en-US'
    const isBrazil = effectiveLocale === 'pt-BR'
    const currency = isBrazil ? 'BRL' : 'USD'
    const currencySymbol = isBrazil ? 'R$' : '$'

    console.log('💰 [useCurrencyFormatter] Currency config:', {
      tenantLocale,
      effectiveLocale,
      isBrazil,
      currency,
      currencySymbol
    })

    return { locale: effectiveLocale, currency, currencySymbol }
  }, [tenantLocale])

  const formatCurrency = (amount: number | string): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    if (isNaN(numericAmount)) {
      return `${currencySymbol} 0.00`
    }

    // Use Intl.NumberFormat for locale-aware formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })

    return formatter.format(numericAmount)
  }

  const getCurrency = (): string => {
    return currency
  }

  const getCurrencySymbol = (): string => {
    return currencySymbol
  }

  return {
    formatCurrency,
    getCurrency,
    getCurrencySymbol
  }
}
