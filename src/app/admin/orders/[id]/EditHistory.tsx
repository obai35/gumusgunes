'use client'

interface EditHistoryProps {
  editHistory: string | null
}

export default function EditHistory({ editHistory }: EditHistoryProps) {
  if (!editHistory) return null

  let entries: any[]
  try { entries = Array.isArray(JSON.parse(editHistory)) ? JSON.parse(editHistory) : [] } catch { return null }
  if (entries.length === 0) return null

  const fieldLabels: Record<string, string> = {
    fullName: 'Customer Name', phone: 'Phone', address: 'Address', city: 'City', postalCode: 'Postal Code',
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h2 className="font-display font-semibold text-navy mb-4">Edit History</h2>
      <div className="space-y-3">
        {entries.map((entry: any, i: number) => {
          const label = fieldLabels[entry.field] || (entry.field?.startsWith('item_') ? 'Item Quantity' : entry.field)
          return (
            <div key={i} className="flex items-start gap-3 text-sm border-l-2 border-navy pl-3 py-1">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{new Date(entry.editedAt).toLocaleString()}</p>
                <p className="text-navy font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="line-through">{String(entry.oldValue).slice(0, 50)}</span>
                  {' → '}
                  <span className="text-green-600">{String(entry.newValue).slice(0, 50)}</span>
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
