import { db } from './db'

const MODELS_WITH_STORE_ID = new Set([
  'Product', 'Category', 'Brand', 'Order', 'OrderItem', 'Review',
  'User', 'Discount', 'BlogPost', 'FaqEntry', 'Banner', 'StaticPage',
  'Newsletter', 'Branch', 'PaymentMethod', 'ShippingMethod', 'Governorate',
  'Supplier', 'Expense', 'Shift', 'Role', 'Admin', 'Warehouse',
  'PurchaseOrder', 'PurchaseOrderItem', 'ReturnRequest',
  'Currency', 'Translation', 'TaxRate', 'Address', 'WishlistItem',
  'BackInStock', 'CustomerNote', 'CustomerSegment', 'LoyaltyTier',
  'AbandonedCart', 'EmailCampaign', 'PushCampaign', 'SaleCampaign',
  'GiftCard', 'Referral', 'ReferralConfig', 'SocialAccount',
  'SocialPost', 'SocialDraft', 'SocialCampaign', 'Webhook',
  'ApiKey', 'FeatureFlag', 'ActivityLog', 'Conversation', 'Message',
  'Account', 'Budget', 'BankAccount', 'BankTransaction', 'Invoice',
  'InvoiceItem', 'Bill', 'BillItem', 'JournalEntry', 'JournalLine',
  'StockTransfer', 'BranchStock', 'StockLevel', 'InventoryLog',
  'QC_Template', 'QC_Check', 'Employee', 'PayrollRun', 'PayrollItem',
  'ScheduledReport', 'ReturnItem', 'Shipment', 'ShippingRate', 'ShippingRule',
  'SavedCard', 'CustomerPushToken', 'PushToken', 'PushPreference',
  'ResetToken', 'OtpVerification', 'EmailLog', 'CustomerActivityLog',
  'ProductRelation', 'ProductEmbedding',
  'BillOfMaterial', 'BomItem', 'ProductionOrder', 'ProductionOrderMaterial',
  'ProductionOrderLabor', 'ProductionOrderOutput', 'WorkCenter',
  'Group', 'GroupEntity', 'InterCompanyTransaction', 'ConsolidationRun',
  'FixedAsset', 'DepreciationEntry',
  'PriceList', 'PriceListItem', 'CostHistory',
  'CostPool', 'PricingFormula', 'ProductCostBreakdown',
  'Routing', 'RoutingStep', 'ProductionOperation', 'ProdOpLabor',
])

export function storeDb(storeId: string) {
  return db.$extends({
    name: 'store-scoped',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!MODELS_WITH_STORE_ID.has(model)) return query(args)

          if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`[storeDb] ${operation} on ${model} is not store-scoped — use findFirst/findFirstOrThrow instead`)
            }
            return query(args)
          }

          const WHERE_OPS = new Set([
            'findMany', 'findFirst', 'findFirstOrThrow', 'count', 'aggregate', 'groupBy',
            'update', 'updateMany', 'delete', 'deleteMany',
          ])

          if (WHERE_OPS.has(operation)) {
            ;(args as any).where = { ...(args as any)?.where, storeId }
          } else if (operation === 'create') {
            ;(args as any).data = { ...(args as any)?.data, storeId }
          } else if (operation === 'createMany') {
            ;(args as any).data = ((args as any).data as any[]).map(d => ({ ...d, storeId }))
          } else if (operation === 'upsert') {
            ;(args as any).where = { ...(args as any)?.where, storeId }
            ;(args as any).create = { ...(args as any)?.create, storeId }
          }

          return query(args)
        },
      },
    },
  })
}
