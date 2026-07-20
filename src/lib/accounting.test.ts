import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createSaleJournalEntry,
  createRefundJournalEntry,
  createJournalEntry,
  AccountingError,
} from './accounting'

const mockAccount = vi.fn()
const mockCreateEntry = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    account: {
      findUnique: (args: any) => mockAccount(args),
    },
    journalEntry: {
      create: (args: any) => mockCreateEntry(args),
    },
  },
}))

const accounts: Record<string, { id: string; code: string }> = {
  '1000': { id: 'a-cash', code: '1000' },
  '1100': { id: 'a-bank', code: '1100' },
  '1200': { id: 'a-ar', code: '1200' },
  '4000': { id: 'a-rev', code: '4000' },
  '4100': { id: 'a-ret', code: '4100' },
  '5000': { id: 'a-cogs', code: '5000' },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAccount.mockImplementation(({ where: { code } }: { where: { code: string } }) =>
    Promise.resolve(accounts[code] ?? null)
  )
  mockCreateEntry.mockImplementation(({ data }: any) =>
    Promise.resolve({ id: 'entry-1', ...data, lines: { create: data.lines.create } })
  )
})

describe('createSaleJournalEntry', () => {
  it('debits Accounts Receivable for COD orders', async () => {
    const entry = await createSaleJournalEntry({
      id: 'order-1',
      totalAmount: 500,
      paymentMethod: 'cod',
      cashAmount: null,
      cardAmount: null,
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-ar')
    expect(debitLine.debit).toBe(500)
  })

  it('debits Cash for cash orders', async () => {
    const entry = await createSaleJournalEntry({
      id: 'order-2',
      totalAmount: 300,
      paymentMethod: 'cash',
      cashAmount: null,
      cardAmount: null,
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-cash')
  })

  it('debits Bank for bank_transfer orders', async () => {
    const entry = await createSaleJournalEntry({
      id: 'order-3',
      totalAmount: 1000,
      paymentMethod: 'bank_transfer',
      cashAmount: null,
      cardAmount: null,
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-bank')
  })
})

describe('createRefundJournalEntry', () => {
  it('credits Accounts Receivable for COD refunds', async () => {
    const entry = await createRefundJournalEntry({
      id: 'order-1',
      refundedAmount: 200,
      paymentMethod: 'cod',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const creditLine = lines.find((l: any) => l.credit > 0)
    expect(creditLine.accountId).toBe('a-ar')
    expect(creditLine.credit).toBe(200)
  })

  it('credits Cash for cash refunds', async () => {
    const entry = await createRefundJournalEntry({
      id: 'order-2',
      refundedAmount: 100,
      paymentMethod: 'cash',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const creditLine = lines.find((l: any) => l.credit > 0)
    expect(creditLine.accountId).toBe('a-cash')
  })
})

describe('createJournalEntry validation', () => {
  it('rejects unbalanced entries', async () => {
    await expect(
      createJournalEntry({
        date: new Date(),
        description: 'Test',
        type: 'sale',
        lines: [
          { accountCode: '1000', debit: 100 },
          { accountCode: '4000', credit: 99 },
        ],
      })
    ).rejects.toThrow(AccountingError)
  })

  it('rejects negative amounts', async () => {
    await expect(
      createJournalEntry({
        date: new Date(),
        description: 'Test',
        type: 'sale',
        lines: [
          { accountCode: '1000', debit: -50 },
          { accountCode: '4000', credit: -50 },
        ],
      })
    ).rejects.toThrow(AccountingError)
  })

  it('accepts valid balanced entry', async () => {
    const entry = await createJournalEntry({
      date: new Date(),
      description: 'Test',
      type: 'sale',
      lines: [
        { accountCode: '1000', debit: 100 },
        { accountCode: '4000', credit: 100 },
      ],
    })
    expect(entry.id).toBe('entry-1')
  })
})

describe('createSaleJournalEntry edge cases', () => {
  it('rejects unknown payment method', async () => {
    await expect(
      createSaleJournalEntry({
        id: 'order-bad',
        totalAmount: 100,
        paymentMethod: 'bitcoin',
        cashAmount: null,
        cardAmount: null,
        createdAt: new Date(),
      })
    ).rejects.toThrow(AccountingError)
  })

  it('handles instapay and wallet payment methods', async () => {
    for (const method of ['instapay', 'wallet']) {
      mockCreateEntry.mockClear()
      mockAccount.mockClear()
      const entry = await createSaleJournalEntry({
        id: `order-${method}`,
        totalAmount: 100,
        paymentMethod: method,
        cashAmount: null,
        cardAmount: null,
        createdAt: new Date(),
      })
      const lines = entry.lines.create
      const debitLine = lines.find((l: any) => l.debit > 0)
      expect(debitLine.accountId).toBe('a-cash')
    }
  })
})

describe('createRefundJournalEntry edge cases', () => {
  it('credits Bank for bank_transfer refunds', async () => {
    const entry = await createRefundJournalEntry({
      id: 'order-bt',
      refundedAmount: 150,
      paymentMethod: 'bank_transfer',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const creditLine = lines.find((l: any) => l.credit > 0)
    expect(creditLine.accountId).toBe('a-bank')
  })
})
