/**
 * Password Generator Utility (Shared)
 * Used by backend (platform-auth) for password generation
 */

/**
 * Generate a random password with specified length
 * Uses a character set that excludes visually ambiguous characters (I, l, 1, O, 0)
 *
 * @param {number} length - Password length (default: 12)
 * @returns {string} Random password
 */
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

module.exports = { generateRandomPassword }
