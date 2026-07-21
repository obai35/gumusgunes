export function formatCurrency(v: number | undefined | null) { return v != null ? `E£${v.toFixed(2)}` : 'E£0.00' }
