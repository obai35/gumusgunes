import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const accounts = [
  // Assets
  { code: '1000', name: 'Cash', nameAr: 'نقدي', type: 'asset' },
  { code: '1100', name: 'Bank', nameAr: 'بنك', type: 'asset' },
  { code: '1200', name: 'Accounts Receivable', nameAr: 'حسابات مدينة', type: 'asset' },
  { code: '1300', name: 'Inventory', nameAr: 'المخزون', type: 'asset' },
  // Liabilities
  { code: '2000', name: 'Accounts Payable', nameAr: 'حسابات دائنة', type: 'liability' },
  { code: '2100', name: 'Sales Tax Payable', nameAr: 'ضريبة المبيعات المستحقة', type: 'liability' },
  // Equity
  { code: '3000', name: "Owner's Equity", nameAr: 'حقوق الملكية', type: 'equity' },
  { code: '3100', name: 'Retained Earnings', nameAr: 'الأرباح المحتجزة', type: 'equity' },
  // Income
  { code: '4000', name: 'Sales Revenue', nameAr: 'إيرادات المبيعات', type: 'income' },
  { code: '4100', name: 'Sales Returns & Allowances', nameAr: 'مرتجعات المبيعات', type: 'income' },
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', type: 'expense' },
  { code: '5100', name: 'Salaries & Wages', nameAr: 'الرواتب والأجور', type: 'expense' },
  { code: '5200', name: 'Rent', nameAr: 'الإيجار', type: 'expense' },
  { code: '5300', name: 'Utilities', nameAr: 'المرافق', type: 'expense' },
  { code: '5400', name: 'Supplies', nameAr: 'المستلزمات', type: 'expense' },
  { code: '5500', name: 'Other Expenses', nameAr: 'مصروفات أخرى', type: 'expense' },
]

async function main() {
  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: { name: acc.name, nameAr: acc.nameAr, type: acc.type },
      create: acc,
    })
  }
  console.log(`Seeded ${accounts.length} accounts`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
