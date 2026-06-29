import { TOTP } from 'otplib'
import qrcode from 'qrcode'

const totp = new TOTP({ step: 30, window: 1 })

export function generateTotpSecret(): string {
  return totp.generateSecret()
}

export function generateTotpQrCode(secret: string, email: string): Promise<string> {
  const uri = totp.keyuri(email, 'Gümüş Güneş', secret)
  return qrcode.toDataURL(uri)
}

export function verifyTotpCode(token: string, secret: string): boolean {
  try {
    return totp.verify({ token, secret })
  } catch {
    return false
  }
}
