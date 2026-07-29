import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const PASSWORD_PEPPER = process.env.PASSWORD_PEPPER || ''
  const password = 'admin123'
  const hashed = await bcrypt.hash(PASSWORD_PEPPER + password, 12)

  // Find or create default store
  let store = await prisma.store.findFirst()
  if (!store) {
    store = await prisma.store.create({
      data: { name: 'Default Store', slug: 'default', email: 'admin@example.com' },
    })
    console.log('Created default store:', store.id)
  } else {
    console.log('Using existing store:', store.id)
  }

  // Create super admin role
  const role = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: { storeId: store.id },
    create: {
      name: 'super_admin',
      storeId: store.id,
      permissions: JSON.stringify([
        'dashboard', 'accounting', 'orders', 'products', 'customers', 'inventory', 'admins',
        'branches', 'categories', 'discounts', 'reviews', 'settings',
        'payments', 'shipping', 'reports', 'social', 'editor', 'pos', 'activity',
        'receipts', 'stock_transfers', 'security', 'newsletter', 'customer_service',
        'chat', 'marketing',
        'blog', 'faq', 'banners', 'pages', 'media',
        'system', 'pricing', 'manufacturing',
      ]),
    },
  })
  console.log('Role created:', role.name)

  // Create admin
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@gumusgunes.com' },
    update: { password: hashed },
    create: {
      email: 'admin@gumusgunes.com',
      name: 'Admin',
      password: hashed,
      storeId: store.id,
      role: 'super_admin',
      roleId: role.id,
      phone: '+905551234567',
    },
  })
  console.log('Admin created:', admin.email)

  // Create branch for POS
  const branchPassword = await bcrypt.hash(PASSWORD_PEPPER + 'branch123', 12)
  const branch = await prisma.branch.upsert({
    where: { email: 'branch@gumusgunes.com' },
    update: { password: branchPassword },
    create: {
      name: 'Main Branch',
      email: 'branch@gumusgunes.com',
      password: branchPassword,
      storeId: store.id,
      phone: '+905551234568',
      address: 'Grand Bazaar, Istanbul',
      isActive: true,
    },
  })
  console.log('Branch created:', branch.email)
  console.log('')
  console.log('--- Login Credentials ---')
  console.log('Admin panel: admin@gumusgunes.com / admin123')
  console.log('POS login:   branch@gumusgunes.com / branch123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
