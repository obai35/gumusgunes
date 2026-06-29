import speakeasy from 'speakeasy'
import qrcode from 'qrcode'

export function generateTotpSecret(): string {
  return speakeasy.generateSecret({ length: 20 }).base32
}

export function generateTotpQrCode(secret: string, email: string): Promise<string> {
  const uri = speakeasy.otpauthURL({
    secret,
    label: email,
    issuer: 'Gümüş Güneş',
    encoding: 'base32',
  })
  return qrcode.toDataURL(uri)
}

export function verifyTotpCode(token: string, secret: string): boolean {
  try {
    return speakeasy.totp.verify({
      secret,
      token,
      encoding: 'base32',
      window: 1,
    })
  } catch {
    return false
  }
}
