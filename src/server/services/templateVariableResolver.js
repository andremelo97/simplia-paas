/**
 * Template Variable Resolver Service
 *
 * Resolves system variables in templates like $patient.first_name$, $date.now$, etc.
 * Used by the AI Template Filler to replace variables with actual data.
 */

/**
 * Resolves all system variables in a template string
 * @param {string} template - Template content with variables like $patient.first_name$
 * @param {Object} context - Context data for resolving variables
 * @param {Object} context.patient - Patient data (if available)
 * @param {Object} context.session - Session data (if available)
 * @param {Object} context.user - Current user data
 * @param {string} context.tenantId - Current tenant ID
 * @returns {string} - Template with resolved variables
 */
function resolveTemplateVariables(template, context) {
  if (!template) {
    return template
  }

  const { patient, session, user } = context

  // Define variable resolvers
  const variables = {
    // Patient variables
    'patient.first_name': patient?.firstName || '',
    'patient.last_name': patient?.lastName || '',
    'patient.fullName': patient ?
      `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient'
      : '',

    // Date variables
    'date.now': new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),

    // Session variables
    'session.created_at': session?.createdAt ?
      new Date(session.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '',

    // Current user (me) variables
    'me.first_name': user?.first_name || '',
    'me.last_name': user?.last_name || '',
    'me.fullName': user ?
      `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Doctor'
      : '',
    'me.clinic': user?.clinic || '' // TODO: Define how clinic name is stored
  }

  // Replace all variables in the template
  let resolvedTemplate = template

  Object.entries(variables).forEach(([variableName, value]) => {
    const regex = new RegExp(`\\$${variableName.replace('.', '\\.')}\\$`, 'g')
    resolvedTemplate = resolvedTemplate.replace(regex, value || '')
  })

  return resolvedTemplate
}

/**
 * Extracts all variables used in a template
 * @param {string} template - Template content
 * @returns {Array<string>} - Array of variable names found in template
 */
function extractTemplateVariables(template) {
  if (!template) {
    return []
  }

  const variableRegex = /\$([^$]+)\$/g
  const variables = []
  let match

  while ((match = variableRegex.exec(template)) !== null) {
    variables.push(match[1])
  }

  return [...new Set(variables)] // Remove duplicates
}

/**
 * Validates that all variables in a template are supported
 * @param {string} template - Template content
 * @returns {Object} - Validation result with isValid and unsupportedVariables
 */
function validateTemplateVariables(template) {
  const supportedVariables = [
    'patient.first_name',
    'patient.last_name',
    'patient.fullName',
    'date.now',
    'session.created_at',
    'me.first_name',
    'me.last_name',
    'me.fullName',
    'me.clinic'
  ]

  const usedVariables = extractTemplateVariables(template)
  const unsupportedVariables = usedVariables.filter(
    variable => !supportedVariables.includes(variable)
  )

  return {
    isValid: unsupportedVariables.length === 0,
    unsupportedVariables,
    usedVariables,
    supportedVariables
  }
}

module.exports = {
  resolveTemplateVariables,
  extractTemplateVariables,
  validateTemplateVariables
}