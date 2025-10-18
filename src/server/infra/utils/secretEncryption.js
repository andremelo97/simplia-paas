const crypto = require('crypto')

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // Recommended length for GCM

function getEncryptionKey() {
  const rawKey =
    process.env.COMMUNICATION_ENCRYPTION_KEY ||
    process.env.APP_ENCRYPTION_KEY ||
    process.env.JWT_SECRET

  if (!rawKey) {
    throw new Error(
      '[secretEncryption] Missing COMMUNICATION_ENCRYPTION_KEY (or fallback APP_ENCRYPTION_KEY/JWT_SECRET) environment variable'
    )
  }

  // Derive a 32-byte key from the provided secret
  return crypto.createHash('sha256').update(String(rawKey)).digest()
}

/**
 * Encrypt a secret value using AES-256-GCM.
 * Returns a base64 string containing iv, auth tag, and ciphertext.
 */
function encryptSecret(value) {
  if (value === null || value === undefined) {
    return value
  }

  const stringValue = String(value)
  if (!stringValue) {
    return stringValue
  }

  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(stringValue, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join(':')
}

/**
 * Decrypt a value previously encrypted with encryptSecret.
 * Returns the plaintext string.
 */
function decryptSecret(payload) {
  if (payload === null || payload === undefined) {
    return payload
  }

  const stringPayload = String(payload)

  // Detect unencrypted legacy values (no separators)
  if (!stringPayload.includes(':')) {
    return stringPayload
  }

  const [ivB64, authTagB64, dataB64] = stringPayload.split(':')
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload format')
  }

  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const encryptedData = Buffer.from(dataB64, 'base64')
  const key = getEncryptionKey()

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])
  return decrypted.toString('utf8')
}

module.exports = {
  encryptSecret,
  decryptSecret
}
