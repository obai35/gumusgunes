import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { sendEmail, adminRecoveryEmail } from '@/lib/email'
import { db } from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

async function handler(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Always return success to prevent admin enumeration.
    const admin = await db.admin.findUnique({ where: { email } })
    if (!admin) {
      return NextResponse.json({ message: 'If the email exists, a recovery link has been sent' })
    }

    await db.resetToken.updateMany({
      where: { email, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })

    const token = crypto.randomBytes(32).toString('hex')
    const hashedToken = await bcrypt.hash(token, 10)
    await db.resetToken.create({
      data: {
        email,
        storeId: admin.storeId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })

    await sendEmail(adminRecoveryEmail(token, email))

    return NextResponse.json({ message: 'If the email exists, a recovery link has been sent' })
  } catch (error) {
    console.error('[admin-recovery-request]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 3, window: '3600s', failClosed: true })