const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'log'
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_FROM || 'noreply@gumusgunes.com'
const FROM_NAME = process.env.FROM_NAME || 'Gümüş Güneş'

type EmailPayload = {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { to, subject, html, text } = payload

  switch (EMAIL_PROVIDER) {
    case 'sendgrid': {
      const key = process.env.SENDGRID_API_KEY
      if (!key) { console.warn('SENDGRID_API_KEY not set'); return false }
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: FROM_EMAIL, name: FROM_NAME },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      })
      return res.ok
    }
    case 'resend': {
      const key = process.env.RESEND_API_KEY
      if (!key) { console.warn('RESEND_API_KEY not set'); return false }
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html }),
      })
      return res.ok
    }
    case 'smtp': {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const nodemailer = (await import('nodemailer')).default
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        })
        await transporter.sendMail({ from: FROM_EMAIL, to, subject, html, text })
        return true
      }
      console.warn('SMTP not fully configured')
      return false
    }
    default: {
      console.log('[email]', { to, subject, text: text || html?.substring(0, 100) })
      return true
    }
  }
}

export function orderConfirmationEmail(order: { orderNumber: string; fullName: string; totalAmount: number; email: string; items: { product?: { name?: string }; quantity: number; price: number }[] }): EmailPayload {
  const itemsHtml = order.items.map(i =>
    `<tr><td>${i.product?.name || 'Product'}</td><td>x${i.quantity}</td><td>${i.price.toFixed(2)}</td></tr>`
  ).join('')

  return {
    to: order.email || '',
    subject: `Order Confirmed - #${order.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Thank you, ${order.fullName}!</h1>
        <p>Your order <strong>#${order.orderNumber}</strong> has been confirmed.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr><th style="text-align:left">Item</th><th>Qty</th><th>Price</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <p style="font-size: 1.2em; font-weight: bold;">Total: $${order.totalAmount.toFixed(2)}</p>
      </div>`,
    text: `Thank you, ${order.fullName}! Your order #${order.orderNumber} has been confirmed. Total: $${order.totalAmount.toFixed(2)}`,
  }
}

export function passwordResetEmail(token: string, email: string): EmailPayload {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000'
  const link = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`
  return {
    to: email,
    subject: 'Reset Your Password',
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #1e3a5f; color: white; text-decoration: none; border-radius: 8px;">Reset Password</a>
    </div>`,
    text: `Reset your password here: ${link}`,
  }
}

export function shipmentNotificationEmail(shipment: { trackingNumber: string; status: string; order?: { orderNumber: string } }): EmailPayload {
  return {
    to: '',
    subject: `Your Order #${shipment.order?.orderNumber || ''} Has Shipped`,
    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Your Order Has Shipped!</h1>
      <p>Tracking Number: <strong>${shipment.trackingNumber}</strong></p>
      <p>Status: ${shipment.status}</p>
    </div>`,
    text: `Your order has shipped! Tracking: ${shipment.trackingNumber}`,
  }
}
