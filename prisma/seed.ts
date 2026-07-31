import { PrismaClient } from '@prisma/client'
import { encrypt } from '../src/lib/encryption'

const prisma = new PrismaClient()

const governorates = [
  { name: 'Cairo', nameAr: 'القاهرة' },
  { name: 'Alexandria', nameAr: 'الإسكندرية' },
  { name: 'Giza', nameAr: 'الجيزة' },
  { name: 'Qalyubia', nameAr: 'القليوبية' },
  { name: 'Port Said', nameAr: 'بورسعيد' },
  { name: 'Suez', nameAr: 'السويس' },
  { name: 'Damietta', nameAr: 'دمياط' },
  { name: 'Dakahlia', nameAr: 'الدقهلية' },
  { name: 'Sharqia', nameAr: 'الشرقية' },
  { name: 'Gharbia', nameAr: 'الغربية' },
  { name: 'Monufia', nameAr: 'المنوفية' },
  { name: 'Beheira', nameAr: 'البحيرة' },
  { name: 'Kafr El Sheikh', nameAr: 'كفر الشيخ' },
  { name: 'Minya', nameAr: 'المنيا' },
  { name: 'Asyut', nameAr: 'أسيوط' },
  { name: 'Sohag', nameAr: 'سوهاج' },
  { name: 'Qena', nameAr: 'قنا' },
  { name: 'Luxor', nameAr: 'الأقصر' },
  { name: 'Aswan', nameAr: 'أسوان' },
  { name: 'Red Sea', nameAr: 'البحر الأحمر' },
  { name: 'New Valley', nameAr: 'الوادي الجديد' },
  { name: 'Matrouh', nameAr: 'مطروح' },
  { name: 'North Sinai', nameAr: 'شمال سيناء' },
  { name: 'South Sinai', nameAr: 'جنوب سيناء' },
  { name: 'Beni Suef', nameAr: 'بني سويف' },
  { name: 'Fayoum', nameAr: 'الفيوم' },
  { name: 'Ismailia', nameAr: 'الإسماعيلية' },
]

function enc(obj: Record<string, any>) {
  return encrypt(JSON.stringify(obj))
}

const paymentMethods = [
  { code: 'card', name: 'Card (Stripe)', nameAr: 'بطاقة (Stripe)', sortOrder: 1, isActive: true, config: enc({ publishableKey: '', secretKey: '', webhookSecret: '' }) },
  { code: 'paypal', name: 'PayPal', nameAr: 'PayPal', sortOrder: 2, isActive: true, config: enc({ clientId: '', clientSecret: '', sandbox: true }) },
  { code: 'transfer', name: 'Bank Transfer', nameAr: 'تحويل بنكي', sortOrder: 3, isActive: true, config: enc({ bankName: 'Garanti BBVA — Istanbul', bankNameAr: 'Garanti BBVA — إسطنبول', iban: 'TR12 0006 2001 2345 6789 0000 01', referenceInstructions: 'Use your order number as the payment reference.', referenceInstructionsAr: 'استخدم رقم طلبك كمرجع للدفع.' }) },
  { code: 'cod', name: 'Cash on Delivery', nameAr: 'الدفع عند الاستلام', sortOrder: 4, isActive: true, config: enc({ handlingFee: 2 }) },
  { code: 'instapay', name: 'InstaPay QR', nameAr: 'InstaPay', sortOrder: 5, isActive: false, config: enc({ phone: '', qrUrl: '' }) },
  { code: 'vodafone-cash', name: 'Vodafone Cash', nameAr: 'فودافون كاش', sortOrder: 6, isActive: false, config: enc({ number: '' }) },
  { code: 'orange-cash', name: 'Orange Cash', nameAr: 'أورنج كاش', sortOrder: 7, isActive: false, config: enc({ number: '' }) },
  { code: 'etisalat-wallet', name: 'Etisalat Wallet', nameAr: 'اتصالات Wallet', sortOrder: 8, isActive: false, config: enc({ number: '' }) },
  { code: 'fawry', name: 'Fawry', nameAr: 'فوري', sortOrder: 9, isActive: false, config: enc({ reference: '' }) },
]

async function seedCurrencies() {
  const currencies = [
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', exchangeRate: 1, isDefault: true, isActive: true },
    { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.0208, isDefault: false, isActive: true },
    { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.0192, isDefault: false, isActive: true },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', exchangeRate: 0.718, isDefault: false, isActive: true },
  ]
  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: { ...c, storeId: DEFAULT_STORE_ID },
      create: { ...c, storeId: DEFAULT_STORE_ID },
    })
  }
  console.log('  ✓ Currencies seeded')
}

let DEFAULT_STORE_ID: string

async function seedDefaultStore() {
  const existing = await prisma.store.findFirst()
  if (existing) {
    DEFAULT_STORE_ID = existing.id
    console.log(`Using existing store: ${existing.name} (${existing.id})`)
    return
  }
  const store = await prisma.store.create({
    data: {
      name: 'Default Store',
      slug: 'default',
      email: 'admin@example.com',
    },
  })
  DEFAULT_STORE_ID = store.id
  console.log(`Created default store: ${store.name} (${store.id})`)
}

async function main() {
  await seedDefaultStore()

  console.log('Seeding governorates...')
  const country = await prisma.country.upsert({
    where: { storeId_name: { storeId: DEFAULT_STORE_ID, name: 'Egypt' } },
    update: {},
    create: { storeId: DEFAULT_STORE_ID, name: 'Egypt', nameAr: 'مصر', isoCode: 'EG' },
  })
  for (const g of governorates) {
    await prisma.governorate.upsert({
      where: { storeId_name: { storeId: DEFAULT_STORE_ID, name: g.name } },
      update: {},
      create: { ...g, storeId: DEFAULT_STORE_ID, countryId: country.id },
    })
  }
  console.log(`Seeded ${governorates.length} governorates`)

  console.log('Seeding payment methods...')
  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: pm.code },
      update: { config: pm.config },
      create: { ...pm, storeId: DEFAULT_STORE_ID },
    })
  }
  console.log(`Seeded ${paymentMethods.length} payment methods`)

  console.log('Seeding currencies...')
  await seedCurrencies()

  console.log('Seeding product knowledge graph...')
  try {
    const { execSync } = require('child_process')
    execSync('npx tsx prisma/seed-graph.ts', { stdio: 'inherit', timeout: 300000 })
  } catch {
    console.log('Graph seed skipped')
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
