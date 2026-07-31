import { db } from './db'

import { randomInt } from 'crypto'

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999))
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + 10 * 60 * 1000)
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_USER || 'noreply@gumusgunes.com',
    to: email,
    subject: 'Your verification code — Gümüş Güneş',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:24px">
        <div style="text-align:center;margin-bottom:24px">
          <img src="https://gumusgunes.com/gumusgunes-logo.jpeg" alt="Gümüş Güneş" style="width:64px;height:64px;border-radius:50%" />
          <h1 style="font-size:20px;color:#0a1628;margin-top:12px">Your Verification Code</h1>
        </div>
        <div style="background:#f8f6f2;border-radius:16px;padding:32px;text-align:center">
          <p style="color:#6b7280;font-size:14px;margin-bottom:16px">Enter this code to complete your checkout:</p>
          <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0a1628;font-family:monospace;background:white;border-radius:12px;padding:16px;border:1px solid #e5e7eb">${code}</div>
          <p style="color:#6b7280;font-size:12px;margin-top:16px">This code expires in 10 minutes.</p>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px">If you didn't request this code, please ignore this email.</p>
      </div>
    `,
  })
}

export async function createOtpVerification(email: string, storeId: string): Promise<string> {
  const code = generateOtpCode()
  await db.otpVerification.create({
    data: {
      email,
      storeId,
      code,
      type: 'checkout',
      expiresAt: getOtpExpiry(),
    },
  })
  return code
}

export async function verifyOtpCode(email: string, code: string): Promise<boolean> {
  const record = await db.otpVerification.findFirst({
    where: {
      email,
      code,
      type: 'checkout',
      verifiedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) return false

  await db.otpVerification.update({
    where: { id: record.id },
    data: { verifiedAt: new Date() },
  })

  return true
}
