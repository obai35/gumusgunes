import { authenticator } from 'otplib'
import qrcode from 'qrcode'

authenticator.options = { step: 30, window: 1 }

export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

export function generateTotpQrCode(secret: string, email: string): Promise<string> {
  const uri = authenticator.keyuri(email, 'Gümüş Güneş', secret)
  return qrcode.toDataURL(uri)
}

export function verifyTotpCode(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch {
    return false
  }
}
