/**
 * Password Generator Utility
 * Centralized password generation for the entire platform
 */

/**
 * Generate a random password with specified length
 * Uses a character set that excludes visually ambiguous characters (I, l, 1, O, 0)
 *
 * @param length - Password length (default: 12)
 * @returns Random password
 */
export function generateRandomPassword(length: number = 12): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
