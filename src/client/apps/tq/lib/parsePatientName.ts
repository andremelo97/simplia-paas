interface ParsedName {
  firstName: string
  lastName: string | null
}

export function parsePatientName(fullName: string): ParsedName {
  if (!fullName || !fullName.trim()) {
    return {
      firstName: '',
      lastName: null
    }
  }

  const trimmedName = fullName.trim()
  const nameParts = trimmedName.split(/\s+/)

  if (nameParts.length === 0) {
    return {
      firstName: '',
      lastName: null
    }
  }

  if (nameParts.length === 1) {
    return {
      firstName: nameParts[0],
      lastName: null
    }
  }

  // First part is firstName, everything else is lastName
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ')

  return {
    firstName,
    lastName: lastName || null // Se for string vazia, enviar null
  }
}