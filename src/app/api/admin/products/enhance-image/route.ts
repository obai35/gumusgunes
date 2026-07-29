import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { enhanceImage } from '@/lib/enhance-image'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const formData = await req.formData()

  const imageFile = formData.get('image') as File | null
  if (!imageFile) {
    return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
  }

  const productName = formData.get('productName') as string | null
  if (!productName) {
    return NextResponse.json({ error: 'Product name is required' }, { status: 400 })
  }

  const productType = (formData.get('productType') as string) || 'other'
  const customPrompt = formData.get('customPrompt') as string | null

  const buffer = Buffer.from(await imageFile.arrayBuffer())

  try {
    const result = await enhanceImage(buffer, productName, productType, customPrompt || undefined)
    return NextResponse.json(result)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to enhance image', details: message },
      { status: 502 },
    )
  }
}, 'products')
