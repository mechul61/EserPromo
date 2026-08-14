INSERT INTO "ProductGroup" ("skuGroup", "slug", "name", "description", "categoryId", "createdAt", "updatedAt")
SELECT DISTINCT ON ("skuGroup")
  "skuGroup",
  lower(regexp_replace(coalesce("name",'urun'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || lower("skuGroup"),
  "name",
  "description",
  "categoryId",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Product"
WHERE "skuGroup" IS NOT NULL
ON CONFLICT ("skuGroup") DO NOTHING;
