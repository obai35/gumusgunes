import { db } from '@/lib/db'

export class AccountingError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_ACCOUNT' | 'UNBALANCED_ENTRY' | 'INVALID_AMOUNT' | 'DUPLICATE_ENTRY'
  ) {
    super(message)
    this.name = 'AccountingError'
  }
}

type AccountCodes = {
  cash: string
  bank: string
  ar: string
  ap: string
  inventory: string
  wip: string
  finishedGoods: string
  fixedAssets: string
  accumulatedDepreciation: string
  salesRevenue: string
  salesReturns: string
  cogs: string
  taxPayable: string
  salaryPayable: string
  fxGain: string
  fxLoss: string
  expenses: Record<string, string>
  interCompany: {
    dueFrom: string
    dueTo: string
    investment: string
    nci: string
    consolidationDiff: string
    icRevenue: string
    icExpense: string
  }
}

const ACCOUNTS: AccountCodes = {
  cash: '1000',
  bank: '1100',
  ar: '1200',
  ap: '2000',
  inventory: '1300',
  wip: '1320',
  finishedGoods: '1330',
  fixedAssets: '1500',
  accumulatedDepreciation: '1600',
  salesRevenue: '4000',
  salesReturns: '4100',
  cogs: '5000',
  taxPayable: '2100',
  salaryPayable: '2200',
  fxGain: '4600',
  fxLoss: '5600',
  expenses: {
    salaries: '5100',
    rent: '5200',
    utilities: '5300',
    supplies: '5400',
    other: '5500',
    depreciation: '5800',
  },
  interCompany: {
    dueFrom: '1400',
    dueTo: '2300',
    investment: '3200',
    nci: '3400',
    consolidationDiff: '3500',
    icRevenue: '4200',
    icExpense: '5700',
  },
}

export { ACCOUNTS }

export const TAX_PAYABLE_ACCOUNT = '2100'
export const FX_GAIN_ACCOUNT = '4600'
export const FX_LOSS_ACCOUNT = '5600'

const PAYMENT_METHOD_TO_ASSET: Record<string, string> = {
  cash: '1000',
  card: '1000',
  bank_transfer: '1100',
  instapay: '1000',
  wallet: '1000',
  cod: '1200',
}

const EXPENSE_KEYWORDS: Record<string, string> = {
  salaries: '5100',
  rent: '5200',
  utilities: '5300',
  supplies: '5400',
}

function getExpenseAccount(description: string): string {
  const lower = description.toLowerCase()
  for (const [keyword, code] of Object.entries(EXPENSE_KEYWORDS)) {
    if (lower.includes(keyword)) return code
  }
  return ACCOUNTS.expenses.other
}

function getDebitAccount(method: string): string {
  if (method === 'split') {
    throw new AccountingError('Split payments use cashAmount/cardAmount fields', 'INVALID_AMOUNT')
  }
  const account = PAYMENT_METHOD_TO_ASSET[method]
  if (!account) {
    throw new AccountingError(`Unknown payment method: ${method}`, 'INVALID_ACCOUNT')
  }
  return account
}

function validateEntry(lines: { accountCode: string; debit?: number; credit?: number }[]) {
  for (const l of lines) {
    if ((l.debit ?? 0) < 0 || (l.credit ?? 0) < 0) {
      throw new AccountingError('Negative amounts not allowed', 'INVALID_AMOUNT')
    }
  }
  const totalDebit = lines.reduce((s, l) => s + (l.debit ?? 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit ?? 0), 0)
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new AccountingError(
      `Unbalanced entry: debits (${totalDebit}) ≠ credits (${totalCredit})`,
      'UNBALANCED_ENTRY'
    )
  }
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
  storeId?: string
  type: 'sale' | 'refund' | 'expense' | 'reconciliation' | 'opening' | 'cogs' | 'production' | 'interCompany' | 'consolidation' | 'purchasing' | 'depreciation' | 'asset-acquisition' | 'budget'
  orderId?: string
  expenseId?: string
  currency?: string
  exchangeRate?: number
  fxGainLoss?: number
  lines: { accountCode: string; debit?: number; credit?: number }[]
}) {
  validateEntry(data.lines)

  const accountIds = await Promise.all(data.lines.map(l => getAccountId(l.accountCode)))
  const lines = data.lines.map((l, i) => ({
    accountId: accountIds[i],
    storeId: data.storeId ?? '',
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
      storeId: data.storeId ?? '',
      orderId: data.orderId,
      expenseId: data.expenseId,
      currency: data.currency ?? 'EGP',
      exchangeRate: data.exchangeRate ?? 1,
      fxGainLoss: data.fxGainLoss,
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
  tax?: number
  currency?: string
  exchangeRate?: number
  storeId?: string
}) {
  const creditLines: { accountCode: string; credit: number }[] = []
  const taxAmount = order.tax ?? 0
  const revenueAmount = order.totalAmount - taxAmount
  if (revenueAmount > 0) creditLines.push({ accountCode: ACCOUNTS.salesRevenue, credit: revenueAmount })
  if (taxAmount > 0) creditLines.push({ accountCode: ACCOUNTS.taxPayable, credit: taxAmount })

  if (order.paymentMethod === 'split') {
    const hasCash = order.cashAmount != null && order.cashAmount > 0
    const hasCard = order.cardAmount != null && order.cardAmount > 0
    const splitTotal = (order.cashAmount ?? 0) + (order.cardAmount ?? 0)
    if (!hasCash && !hasCard) {
      throw new AccountingError('Split payment must specify cashAmount or cardAmount', 'INVALID_AMOUNT')
    }
    if (Math.abs(splitTotal - order.totalAmount) > 0.01) {
      throw new AccountingError(
        `Split amounts (${splitTotal}) do not match total (${order.totalAmount})`,
        'INVALID_AMOUNT'
      )
    }
    const lines: { accountCode: string; debit?: number; credit?: number }[] = []
    if (hasCash) lines.push({ accountCode: ACCOUNTS.cash, debit: order.cashAmount! })
    if (hasCard) lines.push({ accountCode: ACCOUNTS.bank, debit: order.cardAmount! })
    lines.push(...creditLines)
    return createJournalEntry({
      date: order.createdAt,
      description: `Sale #${order.id.slice(0, 8)}`,
      reference: order.id,
      type: 'sale',
      orderId: order.id,
      storeId: order.storeId,
      currency: order.currency,
      exchangeRate: order.exchangeRate,
      lines,
    })
  }
  const debitAccount = getDebitAccount(order.paymentMethod)
  const lines: { accountCode: string; debit?: number; credit?: number }[] = [
    { accountCode: debitAccount, debit: order.totalAmount },
    ...creditLines,
  ]
  return createJournalEntry({
    date: order.createdAt,
    description: `Sale #${order.id.slice(0, 8)}`,
    reference: order.id,
    type: 'sale',
    orderId: order.id,
    storeId: order.storeId,
    currency: order.currency,
    exchangeRate: order.exchangeRate,
    lines,
  })
}

export async function createRefundJournalEntry(order: {
  id: string
  refundedAmount: number
  totalAmount?: number
  paymentMethod: string
  createdAt: Date
  tax?: number
  refundedCashAmount?: number
  refundedCardAmount?: number
  storeId?: string
}) {
  const taxAmount = order.tax ?? 0
  const totalAmt = order.totalAmount ?? order.refundedAmount
  const taxRate = totalAmt > 0 ? taxAmount / totalAmt : 0
  const refundTax = order.refundedAmount * taxRate
  const refundNet = order.refundedAmount - refundTax

  const lines: { accountCode: string; debit?: number; credit?: number }[] = [
    { accountCode: ACCOUNTS.salesReturns, debit: refundNet },
  ]
  if (refundTax > 0) {
    lines.push({ accountCode: ACCOUNTS.taxPayable, debit: refundTax })
  }

  if (order.paymentMethod === 'split') {
    const refundedCash = order.refundedCashAmount ?? 0
    const refundedCard = order.refundedCardAmount ?? 0
    if (refundedCash <= 0 && refundedCard <= 0) {
      throw new AccountingError(
        'Split refund must specify refundedCashAmount or refundedCardAmount',
        'INVALID_AMOUNT'
      )
    }
    if (Math.abs(refundedCash + refundedCard - order.refundedAmount) > 0.01) {
      throw new AccountingError(
        `Split refund amounts (${refundedCash + refundedCard}) do not match refunded amount (${order.refundedAmount})`,
        'INVALID_AMOUNT'
      )
    }
    if (refundedCash > 0) lines.push({ accountCode: ACCOUNTS.cash, credit: refundedCash })
    if (refundedCard > 0) lines.push({ accountCode: ACCOUNTS.bank, credit: refundedCard })
  } else {
    const creditAccount = getDebitAccount(order.paymentMethod)
    lines.push({ accountCode: creditAccount, credit: order.refundedAmount })
  }

  return createJournalEntry({
    date: order.createdAt,
    description: `Refund for #${order.id.slice(0, 8)}`,
    reference: order.id,
    type: 'refund',
    orderId: order.id,
    storeId: order.storeId,
    lines,
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
  const debitAccount = getExpenseAccount(expense.description)

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
  debitAccountCode?: string
  storeId?: string
}) {
  return createJournalEntry({
    date: new Date(),
    description: `Payment reconciled for #${order.id.slice(0, 8)}`,
    reference: order.id,
    type: 'reconciliation',
    orderId: order.id,
    storeId: order.storeId,
    lines: [
      { accountCode: order.debitAccountCode ?? ACCOUNTS.bank, debit: order.totalAmount },
      { accountCode: ACCOUNTS.ar, credit: order.totalAmount },
    ],
  })
}


