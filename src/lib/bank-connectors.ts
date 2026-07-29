export type BankTransactionRaw = {
  date: string
  description: string
  amount: number
  currency: string
  reference: string
  balance: number
}

export type BankConnector = {
  name: string
  fetch: (accountNumber: string, fromDate: string) => Promise<BankTransactionRaw[]>
}

const MOCK: BankConnector = {
  name: 'Mock (test)',
  async fetch(_accountNumber: string, fromDate: string) {
    const transactions: BankTransactionRaw[] = []
    const from = new Date(fromDate)
    const now = new Date()
    let runningBalance = 50000
    for (let d = new Date(from); d <= now; d.setDate(d.getDate() + 1)) {
      if (Math.random() > 0.6) continue
      const amount = parseFloat((Math.random() * 50000 - 10000).toFixed(2))
      runningBalance += amount
      transactions.push({
        date: d.toISOString().slice(0, 10),
        description: ['Wire transfer', 'POS payment', 'Online payment', 'ATM deposit', 'Service fee'][Math.floor(Math.random() * 5)],
        amount,
        currency: 'EGP',
        reference: `MOCK-${d.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        balance: parseFloat(runningBalance.toFixed(2)),
      })
    }
    return transactions
  },
}

const connectors: Record<string, BankConnector> = {
  mock: MOCK,
}

export function getConnector(name: string): BankConnector | undefined {
  return connectors[name]
}

export function listConnectors(): { id: string; name: string }[] {
  return Object.entries(connectors).map(([id, c]) => ({ id, name: c.name }))
}
