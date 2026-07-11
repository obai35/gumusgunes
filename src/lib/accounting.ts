import { db } from '@/lib/db'

type AccountCodes = {
  cash: string
  bank: string
  ar: string
  inventory: string
  salesRevenue: string
  salesReturns: string
  cogs: string
  expenses: Record<string, string>
}

const ACCOUNTS: AccountCodes = {
  cash: '1000',
  bank: '1100',
  ar: '1200',
  inventory: '1300',
  salesRevenue: '4000',
  salesReturns: '4100',
  cogs: '5000',
  expenses: {
    salaries: '5100',
    rent: '5200',
    utilities: '5300',
    supplies: '5400',
    other: '5500',
  },
}

async function getAccountId(code: string): Promise<string> {
  const account = await db.account.findUnique({ where: { code } })
  if (!account) throw new Error(`Account not found: ${code}`)
  return account.id
}

export async function createJournalEntry(data: {
  date: Date
  description: string
  reference?: string
  type: 'sale' | 'refund' | 'expense' | 'reconciliation' | 'opening'
  orderId?: string
  expenseId?: string
  lines: { accountCode: string; debit?: number; credit?: number }[]
}) {
  const accountIds = await Promise.all(data.lines.map(l => getAccountId(l.accountCode)))
  const lines = data.lines.map((l, i) => ({
    accountId: accountIds[i],
    debit: l.debit || 0,
    credit: l.credit || 0,
  }))

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0)

  const entry = await db.journalEntry.create({
    data: {
      date: data.date,
      description: data.description,
      reference: data.reference,
      type: data.type,
      orderId: data.orderId,
      expenseId: data.expenseId,
      lines: { create: lines },
    },
    include: { lines: { include: { account: true } } },
  })

  return entry
}

export async function createSaleJournalEntry(order: {
  id: string
  totalAmount: number
  cashAmount?: number | null
  cardAmount?: number | null
  paymentMethod: string
  createdAt: Date
}) {
  const debitAccount = order.paymentMethod === 'bank_transfer' ? ACCOUNTS.bank : ACCOUNTS.cash
  return createJournalEntry({
    date: order.createdAt,
    description: `Sale #${order.id.slice(0, 8)}`,
    reference: order.id,
    type: 'sale',
    orderId: order.id,
    lines: [
      { accountCode: debitAccount, debit: order.totalAmount },
      { accountCode: ACCOUNTS.salesRevenue, credit: order.totalAmount },
    ],
  })
}

export async function createRefundJournalEntry(order: {
  id: string
  refundedAmount: number
  paymentMethod: string
  createdAt: Date
}) {
  const creditAccount = order.paymentMethod === 'bank_transfer' ? ACCOUNTS.bank : ACCOUNTS.cash
  return createJournalEntry({
    date: order.createdAt,
    description: `Refund for #${order.id.slice(0, 8)}`,
    reference: order.id,
    type: 'refund',
    orderId: order.id,
    lines: [
      { accountCode: ACCOUNTS.salesReturns, debit: order.refundedAmount },
      { accountCode: creditAccount, credit: order.refundedAmount },
    ],
  })
}

export async function createExpenseJournalEntry(expense: {
  id: string
  amount: number
  paymentMethod: string
  description: string
  createdAt: Date
}) {
  const creditAccount = expense.paymentMethod === 'bank_transfer' ? ACCOUNTS.bank : ACCOUNTS.cash
  const debitAccount = ACCOUNTS.expenses.other

  return createJournalEntry({
    date: expense.createdAt,
    description: expense.description,
    reference: expense.id,
    type: 'expense',
    expenseId: expense.id,
    lines: [
      { accountCode: debitAccount, debit: expense.amount },
      { accountCode: creditAccount, credit: expense.amount },
    ],
  })
}

export async function createReconciliationJournalEntry(order: {
  id: string
  totalAmount: number
  createdAt: Date
}) {
  return createJournalEntry({
    date: new Date(),
    description: `Payment reconciled for #${order.id.slice(0, 8)}`,
    reference: order.id,
    type: 'reconciliation',
    orderId: order.id,
    lines: [
      { accountCode: ACCOUNTS.bank, debit: order.totalAmount },
      { accountCode: ACCOUNTS.ar, credit: order.totalAmount },
    ],
  })
}
