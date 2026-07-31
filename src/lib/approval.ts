import { db } from './db'
import { storeDb } from './store-scoped'
import { logAudit } from './audit'

export async function approveEntries(
  storeId: string,
  adminId: string,
  ids: string[]
): Promise<{ count: number }> {
  const sdb = storeDb(storeId)
  const result = await sdb.journalEntry.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'approved',
      approvedById: adminId,
      approvedAt: new Date(),
    },
  })

  for (const id of ids) {
    await logAudit({
      adminId,
      action: 'approve',
      resource: 'journalEntry',
      resourceId: id,
      details: { status: 'approved' },
    })
  }

  return { count: result.count }
}

export async function rejectEntries(
  storeId: string,
  adminId: string,
  ids: string[],
  reason: string
): Promise<{ count: number }> {
  const sdb = storeDb(storeId)
  const result = await sdb.journalEntry.updateMany({
    where: { id: { in: ids } },
    data: {
      status: 'rejected',
      approvedById: adminId,
      approvedAt: new Date(),
      rejectedReason: reason,
    },
  })

  for (const id of ids) {
    await logAudit({
      adminId,
      action: 'reject',
      resource: 'journalEntry',
      resourceId: id,
      details: { status: 'rejected', reason },
    })
  }

  return { count: result.count }
}

export async function reverseEntry(
  storeId: string,
  adminId: string,
  entryId: string,
  reason?: string
) {
  const sdb = storeDb(storeId)

  const entry = await sdb.journalEntry.findFirst({
    where: { id: entryId },
    include: { lines: true },
  })
  if (!entry) throw new Error('Entry not found')
  if (entry.reversesId) throw new Error('Entry is already a reversal')

  const reversal = await sdb.journalEntry.create({
    data: {
      storeId,
      date: new Date(),
      description: `Reversal: ${entry.description}${reason ? ` (${reason})` : ''}`,
      reference: entry.reference,
      type: entry.type,
      status: 'approved',
      reversesId: entry.id,
      lines: {
        create: entry.lines.map((l) => ({
          accountId: l.accountId,
          storeId,
          debit: l.credit,
          credit: l.debit,
        })),
      },
    },
    include: { lines: { include: { account: true } } },
  })

  await logAudit({
    adminId,
    action: 'reverse',
    resource: 'journalEntry',
    resourceId: entryId,
    details: { reversalId: reversal.id, reason },
  })

  return reversal
}

export type StatusFilter = 'approved' | 'draft' | 'rejected' | 'all'

export function applyStatusFilter(
  where: Record<string, unknown>,
  statusParam?: string | null
): Record<string, unknown> {
  const status = (statusParam || 'approved') as StatusFilter
  if (status !== 'all') {
    where.status = status
  }
  return where
}
