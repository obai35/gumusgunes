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
  { code: '2200', name: 'Salary Payable', nameAr: 'الرواتب المستحقة', type: 'liability' },
  // Equity
  { code: '3000', name: "Owner's Equity", nameAr: 'حقوق الملكية', type: 'equity' },
  { code: '3100', name: 'Retained Earnings', nameAr: 'الأرباح المحتجزة', type: 'equity' },
  { code: '3300', name: 'Currency Translation Reserve', nameAr: 'احتياطي ترجمة العملات', type: 'equity' },
  // Income
  { code: '4000', name: 'Sales Revenue', nameAr: 'إيرادات المبيعات', type: 'income' },
  { code: '4100', name: 'Sales Returns & Allowances', nameAr: 'مرتجعات المبيعات', type: 'income' },
  { code: '4600', name: 'Foreign Exchange Gain', nameAr: 'أرباح فروق العملات', type: 'income' },
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', type: 'expense' },
  { code: '5600', name: 'Foreign Exchange Loss', nameAr: 'خسائر فروق العملات', type: 'expense' },
  { code: '5100', name: 'Salaries & Wages', nameAr: 'الرواتب والأجور', type: 'expense' },
  { code: '5200', name: 'Rent', nameAr: 'الإيجار', type: 'expense' },
  { code: '5300', name: 'Utilities', nameAr: 'المرافق', type: 'expense' },
  { code: '5400', name: 'Supplies', nameAr: 'المستلزمات', type: 'expense' },
  { code: '5500', name: 'Other Expenses', nameAr: 'مصروفات أخرى', type: 'expense' },
  // Inter-Company
  { code: '1400', name: 'Due from Affiliates', nameAr: 'مديونيات الجهات الشقيقة', type: 'asset' },
  { code: '2300', name: 'Due to Affiliates', nameAr: 'دائنون جهات شقيقة', type: 'liability' },
  { code: '3200', name: 'Investment in Subsidiaries', nameAr: 'استثمارات في الشركات التابعة', type: 'equity' },
  { code: '3400', name: 'Non-Controlling Interest', nameAr: 'حصة الأقلية', type: 'equity' },
  { code: '3500', name: 'Consolidation Difference', nameAr: 'فروق الدمج', type: 'equity' },
  { code: '4200', name: 'Inter-Company Revenue', nameAr: 'إيرادات بين الشركات', type: 'income' },
  { code: '5700', name: 'Inter-Company Expense', nameAr: 'مصروفات بين الشركات', type: 'expense' },
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
