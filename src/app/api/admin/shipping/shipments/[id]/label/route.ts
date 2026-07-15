import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const shipment = await db.shipment.findUnique({
    where: { id },
    include: {
      method: true,
      order: {
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
          shippingMethod: true,
        },
      },
    },
  })
  if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })

  const order = shipment.order
  const addressSnapshot = (() => { try { return JSON.parse(shipment.addressSnapshot) } catch { return {} } })()

  const labelHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
  .label { width: 4in; padding: 10px; border: 1px solid #ccc; }
  .header { text-align: center; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 8px; }
  .header h2 { margin: 0; font-size: 14px; }
  .header p { margin: 2px 0; font-size: 11px; }
  .section { margin-bottom: 8px; }
  .section h3 { font-size: 11px; margin: 0 0 4px; text-transform: uppercase; color: #555; }
  .section p { margin: 2px 0; font-size: 12px; }
  .items { font-size: 11px; }
  .items td { padding: 2px 4px; }
  .barcode { text-align: center; margin: 8px 0; font-family: monospace; font-size: 16px; letter-spacing: 2px; }
  .footer { text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ccc; padding-top: 6px; }
  @media print { body { padding: 0; } .label { border: none; } }
</style></head><body>
<div class="label">
  <div class="header">
    <h2>SHIPPING LABEL</h2>
    <p>Order #${order.orderNumber} | ${shipment.trackingNumber}</p>
  </div>
  <div class="section">
    <h3>Ship To</h3>
    <p><strong>${addressSnapshot.fullName || order.fullName}</strong></p>
    <p>${addressSnapshot.street || order.address}</p>
    <p>${addressSnapshot.city || order.city}${addressSnapshot.state ? ', ' + addressSnapshot.state : ''} ${addressSnapshot.postalCode || order.postalCode}</p>
    <p>${addressSnapshot.country || order.country}</p>
    ${addressSnapshot.phone || order.phone ? `<p>Phone: ${addressSnapshot.phone || order.phone}</p>` : ''}
  </div>
  <div class="section">
    <h3>Shipping Method</h3>
    <p>${shipment.method?.name || order.shippingMethod?.name || 'Standard'}</p>
  </div>
  <div class="section">
    <h3>Items</h3>
    <table class="items"><tr><th>Qty</th><th>SKU</th><th>Name</th></tr>
    ${order.items.map(i => `<tr><td>${i.quantity}</td><td>${i.product.sku}</td><td>${i.product.name}</td></tr>`).join('')}
    </table>
  </div>
  <div class="barcode">${shipment.trackingNumber}</div>
  <div class="footer">Generated ${new Date().toLocaleString()}</div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body></html>`

  return new NextResponse(labelHtml, {
    headers: { 'Content-Type': 'text/html' },
  })
}, 'shipping')
