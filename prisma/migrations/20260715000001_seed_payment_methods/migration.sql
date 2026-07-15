INSERT INTO "PaymentMethod" ("id", "code", "name", "nameAr", "description", "descriptionAr", "isActive", "sortOrder", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'card', 'Card (Stripe)', 'بطاقة (Stripe)', NULL, NULL, true, 1, '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod" WHERE "code" = 'card');

INSERT INTO "PaymentMethod" ("id", "code", "name", "nameAr", "description", "descriptionAr", "isActive", "sortOrder", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'paypal', 'PayPal', 'PayPal', NULL, NULL, true, 2, '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod" WHERE "code" = 'paypal');

INSERT INTO "PaymentMethod" ("id", "code", "name", "nameAr", "description", "descriptionAr", "isActive", "sortOrder", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'transfer', 'Bank Transfer', 'تحويل بنكي', NULL, NULL, true, 3, '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod" WHERE "code" = 'transfer');

INSERT INTO "PaymentMethod" ("id", "code", "name", "nameAr", "description", "descriptionAr", "isActive", "sortOrder", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'cod', 'Cash on Delivery', 'الدفع عند الاستلام', NULL, NULL, true, 4, '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod" WHERE "code" = 'cod');

INSERT INTO "PaymentMethod" ("id", "code", "name", "nameAr", "description", "descriptionAr", "isActive", "sortOrder", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'instapay', 'InstaPay QR', 'InstaPay', NULL, NULL, false, 5, '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod" WHERE "code" = 'instapay');

INSERT INTO "PaymentMethod" ("id", "code", "name", "nameAr", "description", "descriptionAr", "isActive", "sortOrder", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'vodafone-cash', 'Vodafone Cash', 'فودافون كاش', NULL, NULL, false, 6, '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod" WHERE "code" = 'vodafone-cash');

INSERT INTO "PaymentMethod" ("id", "code", "name", "nameAr", "description", "descriptionAr", "isActive", "sortOrder", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'orange-cash', 'Orange Cash', 'أورنج كاش', NULL, NULL, false, 7, '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod" WHERE "code" = 'orange-cash');

INSERT INTO "PaymentMethod" ("id", "code", "name", "nameAr", "description", "descriptionAr", "isActive", "sortOrder", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'etisalat-wallet', 'Etisalat Wallet', 'اتصالات Wallet', NULL, NULL, false, 8, '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod" WHERE "code" = 'etisalat-wallet');

INSERT INTO "PaymentMethod" ("id", "code", "name", "nameAr", "description", "descriptionAr", "isActive", "sortOrder", "config", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'fawry', 'Fawry', 'فوري', NULL, NULL, false, 9, '{}', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod" WHERE "code" = 'fawry');
