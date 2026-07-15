import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface PdfOptions {
  title: string
  subtitle?: string
  columns: string[]
  rows: (string | number)[][]
  footers?: { label: string; value: string }[]
}

let companyInfo: { name: string; address?: string; phone?: string; email?: string } | null = null

async function loadCompanyInfo(): Promise<{ name: string; address?: string; phone?: string; email?: string }> {
  if (companyInfo) return companyInfo
  try {
    const res = await fetch('/api/admin/settings')
    if (res.ok) {
      const settings = await res.json()
      companyInfo = {
        name: settings.find((s: any) => s.key === 'site_name')?.value || 'Silver Sun Jewelry',
        address: settings.find((s: any) => s.key === 'site_address')?.value || '',
        phone: settings.find((s: any) => s.key === 'site_phone')?.value || '',
        email: settings.find((s: any) => s.key === 'site_email')?.value || '',
      }
    }
  } catch {}
  if (!companyInfo) companyInfo = { name: 'Silver Sun Jewelry' }
  return companyInfo
}

export async function generatePdf(opts: PdfOptions): Promise<void> {
  const info = await loadCompanyInfo()
  const doc = new jsPDF('p', 'mm', 'a4')

  const pageWidth = doc.internal.pageSize.getWidth()

  doc.setFontSize(18)
  doc.setTextColor(30, 58, 95)
  doc.text(info.name, pageWidth / 2, 20, { align: 'center' })

  if (info.address) {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(info.address, pageWidth / 2, 26, { align: 'center' })
  }

  if (info.phone || info.email) {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text([info.phone || '', info.email || ''].filter(Boolean).join(' | '), pageWidth / 2, 31, { align: 'center' })
  }

  doc.setDrawColor(200, 200, 200)
  doc.line(14, 36, pageWidth - 14, 36)

  doc.setFontSize(14)
  doc.setTextColor(30, 58, 95)
  doc.text(opts.title, 14, 44)

  if (opts.subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(opts.subtitle, 14, 50)
  }

  const startY = opts.subtitle ? 55 : 50
  ;(doc as any).autoTable({
    head: [opts.columns],
    body: opts.rows,
    startY,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    footStyles: { fillColor: [240, 242, 245], fontStyle: 'bold' },
  })

  if (opts.footers && opts.footers.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    let fy = finalY
    for (const f of opts.footers) {
      doc.text(f.label, 14, fy)
      doc.setTextColor(30, 58, 95)
      doc.setFont('Helvetica', 'bold')
      doc.text(f.value, pageWidth - 14, fy, { align: 'right' })
      doc.setFont('Helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      fy += 7
    }
  }

  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
  }

  doc.save(`${opts.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
