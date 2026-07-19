import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { sanitize } from '@/lib/sanitize'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const MAX_FIELD_LENGTH = 1000

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ ok: false, error: 'All fields are required' }, { status: 400 })
    }

    if ([name, subject, message].some(f => f.length > MAX_FIELD_LENGTH) || email.length > 320) {
      return NextResponse.json({ ok: false, error: 'Input too long' }, { status: 400 })
    }

    const cleanName = sanitize(name).replace(/[\r\n]/g, '')
    const cleanEmail = sanitize(email).replace(/[\r\n]/g, '')
    const cleanSubject = sanitize(subject).replace(/[\r\n]/g, '')
    const cleanMessage = sanitize(message)

    const to = process.env.CONTACT_EMAIL || 'concierge@gumusgunes.com'

    await transporter.sendMail({
      from: `"${cleanName}" <${cleanEmail}>`,
      to,
      subject: `[Contact Form] ${cleanSubject}`,
      html: `
        <p><strong>Name:</strong> ${cleanName}</p>
        <p><strong>Email:</strong> ${cleanEmail}</p>
        <p><strong>Subject:</strong> ${cleanSubject}</p>
        <p><strong>Message:</strong></p>
        <p>${cleanMessage.replace(/\n/g, '<br>')}</p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/contact error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to send message' }, { status: 500 })
  }
}
