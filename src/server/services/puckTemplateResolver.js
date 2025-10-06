/**
 * Puck Template Resolver Service
 * 
 * Resolves quote data for Puck templates
 * MUST match EXACTLY the frontend logic from resolveTemplateVariables.ts
 * This ensures patient sees the EXACT same data as authenticated users
 */

/**
 * Format a number as currency
 * MUST match frontend formatCurrency logic exactly
 * @param {number|string} value - The value to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  if (!value && value !== 0) return '$0.00';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `$${numValue.toFixed(2)}`;
}

/**
 * Format a date string
 * MUST match frontend date formatting exactly
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Resolve quote data into structured format for Puck components
 * MUST match EXACTLY the frontend resolveTemplateVariables function
 * See: src/client/apps/tq/lib/resolveTemplateVariables.ts
 * 
 * @param {Object} quote - Quote data from database
 * @param {Object} patient - Patient data from database
 * @param {Array} items - Quote items from database
 * @returns {Object} Resolved quote data matching ResolvedQuoteData interface
 */
function resolveQuoteData(quote, patient, items) {
  return {
    quote: {
      number: quote.number || '',
      total: formatCurrency(quote.total),
      content: quote.content || '',
      status: quote.status || 'draft',
      created_at: formatDate(quote.created_at)
    },
    patient: {
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      full_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'N/A',
      email: patient.email || '',
      phone: patient.phone || ''
    },
    items: (items || []).map(item => ({
      name: item.name || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      base_price: formatCurrency(item.base_price),
      discount: formatCurrency(item.discount_amount),
      final_price: formatCurrency(item.final_price)
    }))
  };
}

/**
 * Create content package for public quote
 * Saves the template + resolved data together
 * Frontend will use both to render the exact same view
 * 
 * @param {Object} templateContent - Original Puck template content
 * @param {Object} quote - Quote data from database
 * @param {Object} patient - Patient data from database
 * @param {Array} items - Quote items from database
 * @returns {Object} Content package with template and resolved data
 */
function createContentPackage(templateContent, quote, patient, items) {
  // Resolve the quote data using EXACT same logic as frontend
  const resolvedData = resolveQuoteData(quote, patient, items);
  
  return {
    // Original template (unchanged)
    template: templateContent || { content: [], root: {} },
    // Resolved data (formatted exactly like frontend)
    resolvedData: resolvedData
  };
}

module.exports = {
  createContentPackage,
  resolveQuoteData,
  formatCurrency,
  formatDate
};

