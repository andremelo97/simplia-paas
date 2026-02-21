export function cleanPhoneForWhatsApp(phone: string, countryCode: string = '55'): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith(countryCode) && digits.length >= (countryCode.length + 8)) {
    return digits
  }
  return `${countryCode}${digits}`
}
