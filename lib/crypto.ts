import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-fallback-encryption-key'
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 100000

export async function encrypt(text: string): Promise<string> {
  try {
    console.log('Starting encryption...')
    
    // Generate a random salt
    const salt = crypto.randomBytes(SALT_LENGTH)
    console.log('Generated salt:', salt.length, 'bytes')
    
    // Generate key using PBKDF2
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, ITERATIONS, KEY_LENGTH, 'sha256')
    console.log('Generated key:', key.length, 'bytes')
    
    // Generate a random IV
    const iv = crypto.randomBytes(IV_LENGTH)
    console.log('Generated IV:', iv.length, 'bytes')
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    // Encrypt the text
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ])
    console.log('Encrypted data:', encrypted.length, 'bytes')
    
    // Get auth tag
    const tag = cipher.getAuthTag()
    console.log('Auth tag:', tag.length, 'bytes')
    
    // Combine all components with clear boundaries
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      encrypted
    ])
    console.log('Final result:', result.length, 'bytes')
    
    // Return as base64
    return result.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw error
  }
}

export async function decrypt(encryptedText: string): Promise<string> {
  try {
    console.log('Starting decryption...')
    
    // Convert from base64
    const buffer = Buffer.from(encryptedText, 'base64')
    console.log('Decoded buffer:', buffer.length, 'bytes')
    
    // Extract components with proper boundaries
    const salt = buffer.subarray(0, SALT_LENGTH)
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH)
    
    console.log('Extracted components:', {
      saltLength: salt.length,
      ivLength: iv.length,
      tagLength: tag.length,
      encryptedLength: encrypted.length
    })
    
    // Generate key using PBKDF2
    const key = crypto.pbkdf2Sync(ENCRYPTION_KEY, salt, ITERATIONS, KEY_LENGTH, 'sha256')
    console.log('Generated key:', key.length, 'bytes')
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])
    console.log('Decrypted data:', decrypted.length, 'bytes')
    
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption error:', error)
    throw error
  }
} 