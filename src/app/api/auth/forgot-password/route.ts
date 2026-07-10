import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withRateLimit } from '@/lib/rate-limit'
import { sendEmail, passwordResetEmail } from '@/lib/email'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

async function handler(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Always return success to prevent email enumeration
    // But only actually send if the user exists
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ message: 'If the email exists, a reset link has been sent' })
    }

    // Invalidate old tokens
    await db.resetToken.updateMany({
      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })

    // Create new token
    const token = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(token, 10)
    await db.resetToken.create({
      data: {
        email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
    })

    // Send email via reusable email service
    await sendEmail(passwordResetEmail(token, email))

    return NextResponse.json({ message: 'If the email exists, a reset link has been sent' })
  } catch (error) {
    console.error('[forgot-password]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 3, window: '3600s', failClosed: true })
