import { PrismaClient } from '@prisma/client'

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

async function main() {
  console.log('Seeding governorates...')
  for (const g of governorates) {
    await prisma.governorate.upsert({
      where: { name: g.name },
      update: {},
      create: g,
    })
  }
  console.log(`Seeded ${governorates.length} governorates`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
