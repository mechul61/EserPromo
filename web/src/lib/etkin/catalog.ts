import path from "node:path";
import { prisma } from "../db";
import { categorySlug, productGroupSlug, productSlug } from "../slug";
import {
  etkinImageUrls,
  parseEtkinPrice,
  toInt,
  type EtkinCategory,
  type EtkinProduct,
} from "./types";
import { downloadToStorage, imageFileName } from "./images";

export type UpsertStats = {
  categories: number;
  products: number;
  imagesDownloaded: number;
};

export async function upsertCategory(
  cat: EtkinCategory,
  options?: { storageRoot?: string; siteDomain?: string; downloadImage?: boolean },
): Promise<void> {
  const id = toInt(cat.kategori_id);
  if (!id || cat.Hata) return;

  const parentRaw = cat.ustkategori_id;
  const parentId =
    parentRaw == null || parentRaw === "" || Number(parentRaw) === 0
      ? null
      : toInt(parentRaw);

  let imageLocalPath: string | undefined;
  if (options?.downloadImage && options.storageRoot && cat.resim) {
    const dl = await downloadToStorage({
      url: cat.resim,
      storageRoot: options.storageRoot,
      relativeDir: path.join("categories", String(id)),
      fileName: `category${pathExt(cat.resim)}`,
      userAgent: options.siteDomain ?? "eserpromo.com",
    });
    if (dl.ok) imageLocalPath = dl.localPath;
  }

  const existing = await prisma.category.findUnique({
    where: { id },
    select: { removed: true, adminLocked: true },
  });
  if (existing?.removed) return;

  await prisma.category.upsert({
    where: { id },
    create: {
      id,
      parentId,
      name: cat.isim,
      slug: categorySlug(cat.isim, id),
      description: cat.aciklama || null,
      imageUrl: cat.resim || null,
      imageLocalPath: imageLocalPath ?? null,
      iconUrl: cat.kat_icon || null,
      sortOrder: toInt(cat.sira),
      showOnHomepage: toInt(cat.anasayfa_gosterim) === 1,
      homepageOrder: toInt(cat.anasayfa_sira),
      sourceMd5: cat.md5 || null,
    },
    update: existing?.adminLocked
      ? { sourceMd5: cat.md5 || null }
      : {
          parentId,
          name: cat.isim,
          description: cat.aciklama || null,
          imageUrl: cat.resim || null,
          ...(imageLocalPath ? { imageLocalPath } : {}),
          iconUrl: cat.kat_icon || null,
          sortOrder: toInt(cat.sira),
          showOnHomepage: toInt(cat.anasayfa_gosterim) === 1,
          homepageOrder: toInt(cat.anasayfa_sira),
          sourceMd5: cat.md5 || null,
        },
  });
}

function pathExt(url: string): string {
  const m = url.match(/\.(jpe?g|png|webp|gif)(\?|$)/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

/**
 * Tek ürün + (varsa) varyantlar dizisini yazar.
 * Her varyant ayrı Product; skuGroup ile bağlanır.
 */
export async function upsertProductTree(
  product: EtkinProduct,
  options: {
    storageRoot: string;
    siteDomain: string;
    downloadImages?: boolean;
    /** Bu sync turunda primary seçimi için */
    markPrimaryIfFirstInGroup?: boolean;
  },
): Promise<{ products: number; imagesDownloaded: number }> {
  const nodes = flattenVariantTree(product);
  let products = 0;
  let imagesDownloaded = 0;

  for (const node of nodes) {
    const result = await upsertSingleProduct(node, options);
    products += 1;
    imagesDownloaded += result.imagesDownloaded;
  }

  // Ailede primary yoksa en düşük id'yi primary yap
  const group = nodes[0]?.urun_kodgrup?.trim() || nodes[0]?.urun_kodu;
  if (group) {
    await ensureGroupPrimary(group);
  }

  return { products, imagesDownloaded };
}

function flattenVariantTree(product: EtkinProduct): EtkinProduct[] {
  const list: EtkinProduct[] = [];
  const walk = (p: EtkinProduct) => {
    if (!p?.urun_id || p.Hata) return;
    list.push(p);
    if (Array.isArray(p.varyantlar)) {
      for (const v of p.varyantlar) walk(v);
    }
  };
  walk(product);
  // Aynı id tekrar gelmesin
  const seen = new Set<number>();
  return list.filter((p) => {
    const id = toInt(p.urun_id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function upsertSingleProduct(
  p: EtkinProduct,
  options: {
    storageRoot: string;
    siteDomain: string;
    downloadImages?: boolean;
  },
): Promise<{ imagesDownloaded: number }> {
  const id = toInt(p.urun_id);
  const categoryId = toInt(p.kategori_id);
  const skuGroup = (p.urun_kodgrup || p.urun_kodu || String(id)).trim();
  const sku = (p.urun_kodu || String(id)).trim();

  const current = await prisma.product.findUnique({
    where: { id },
    select: {
      removed: true,
      adminLocked: true,
      price: true,
      discountLocked: true,
      name: true,
      slug: true,
    },
  });
  if (current?.removed) return { imagesDownloaded: 0 };

  const categoryState = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { removed: true, adminLocked: true },
  });
  if (categoryState?.removed) return { imagesDownloaded: 0 };

  // Kategori yoksa minimal oluştur (ürün FK için)
  await prisma.category.upsert({
    where: { id: categoryId },
    create: {
      id: categoryId,
      name: p.kategori_adi || `Kategori ${categoryId}`,
      slug: categorySlug(p.kategori_adi || `kategori-${categoryId}`, categoryId),
    },
    update: p.kategori_adi && !categoryState?.adminLocked ? { name: p.kategori_adi } : { id: categoryId },
  });

  await prisma.productGroup.upsert({
    where: { skuGroup },
    create: {
      skuGroup,
      name: p.urun_isim,
      slug: productGroupSlug(p.urun_isim, skuGroup),
      description: p.urun_aciklama || null,
      categoryId,
    },
    update: {
      name: p.urun_isim,
      description: p.urun_aciklama || null,
      categoryId,
    },
  });

  await prisma.product.upsert({
    where: { id },
    create: {
      id,
      categoryId,
      sku,
      skuGroup,
      name: p.urun_isim,
      title: p.urun_baslik || null,
      description: p.urun_aciklama || null,
      color: p.urun_renk || null,
      size: p.urun_ebat || null,
      features: p.ozellik || null,
      sortOrder: toInt(p.sira),
      catalogPage: toInt(p.katalog_sayfa_no) || null,
      isManufactured: toInt(p.imalat) === 1,
      discountLocked: toInt(p.kirmiziurun) === 1,
      price: parseEtkinPrice(p.urun_fiyat ?? p.urun_fiyat_virgul),
      vatRate: toInt(p.fiyat_kdv, 20),
      stockTotal: toInt(p.toplam_stok),
      stockCenter: toInt(p.mstok),
      stockIstanbul: toInt(p.istok),
      stockTopkapi: toInt(p.tstok),
      traseUrl: p.urun_trase || null,
      traseFileName: p.urun_trase_dosya_isim || null,
      traseFileSize: toInt(p.urun_trase_dosya_boyut) || null,
      sourceMd5: p.md5 || null,
      slug: productSlug(p.urun_baslik || `${p.urun_kodu} ${p.urun_isim}`, id),
      isActive: true,
      showOnHomepage: true,
      isGroupPrimary: false,
    },
    update: current?.adminLocked
      ? { sourceMd5: p.md5 || null }
      : {
          categoryId,
          sku,
          skuGroup,
          name: p.urun_isim,
          title: p.urun_baslik || null,
          description: p.urun_aciklama || null,
          color: p.urun_renk || null,
          size: p.urun_ebat || null,
          features: p.ozellik || null,
          sortOrder: toInt(p.sira),
          catalogPage: toInt(p.katalog_sayfa_no) || null,
          isManufactured: toInt(p.imalat) === 1,
          discountLocked: toInt(p.kirmiziurun) === 1,
          price: parseEtkinPrice(p.urun_fiyat ?? p.urun_fiyat_virgul),
          vatRate: toInt(p.fiyat_kdv, 20),
          stockTotal: toInt(p.toplam_stok),
          stockCenter: toInt(p.mstok),
          stockIstanbul: toInt(p.istok),
          stockTopkapi: toInt(p.tstok),
          traseUrl: p.urun_trase || null,
          traseFileName: p.urun_trase_dosya_isim || null,
          traseFileSize: toInt(p.urun_trase_dosya_boyut) || null,
          sourceMd5: p.md5 || null,
          isActive: true,
        },
  });

  if (current && !current.adminLocked) {
    const newPrice = parseEtkinPrice(p.urun_fiyat ?? p.urun_fiyat_virgul);
    const isDiscounted = toInt(p.kirmiziurun) === 1;
    const { isFavoriteDiscount, notifyFavoriteDiscount } = await import("../commerce/favorite-alerts");
    if (
      isFavoriteDiscount({
        oldPrice: Number(current.price),
        newPrice,
        wasDiscounted: current.discountLocked,
        isDiscounted,
      })
    ) {
      void notifyFavoriteDiscount({
        productId: id,
        name: p.urun_isim || current.name,
        slug: current.slug,
        oldPrice: Number(current.price),
        newPrice,
        wentOnSale: !current.discountLocked && isDiscounted,
      }).catch((error) => console.error("favorite discount notify", id, error));
    }
  }

  let imagesDownloaded = 0;
  if (options.downloadImages !== false) {
    const urls = etkinImageUrls(p);
    for (const { sortOrder, url } of urls) {
      const dl = await downloadToStorage({
        url,
        storageRoot: options.storageRoot,
        relativeDir: path.join("products", String(id)),
        fileName: imageFileName(sortOrder, url),
        userAgent: options.siteDomain,
      });
      if (dl.ok) {
        imagesDownloaded += 1;
        await prisma.productImage.upsert({
          where: {
            productId_sortOrder: { productId: id, sortOrder },
          },
          create: {
            productId: id,
            sortOrder,
            sourceUrl: url,
            localPath: dl.localPath,
            byteSize: dl.byteSize ?? null,
          },
          update: {
            sourceUrl: url,
            localPath: dl.localPath,
            byteSize: dl.byteSize ?? null,
          },
        });
      }
    }
  }

  return { imagesDownloaded };
}

async function ensureGroupPrimary(skuGroup: string) {
  const primary = await prisma.product.findFirst({
    where: { skuGroup, isGroupPrimary: true, isActive: true, removed: false },
    select: { id: true },
  });
  if (primary) return;

  const first = await prisma.product.findFirst({
    where: { skuGroup, isActive: true, removed: false },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  if (!first) return;

  await prisma.product.update({
    where: { id: first.id },
    data: { isGroupPrimary: true },
  });
}

/**
 * Aynı skuGroup altındaki tüm aktif ürünler (renk/ebat seçimi için).
 */
export async function getVariantSiblings(skuGroup: string) {
  return prisma.product.findMany({
    where: { skuGroup, isActive: true, removed: false },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}

/**
 * Liste vitrini: her aileden bir temsilci (isGroupPrimary).
 */
export async function listProductGroups(options?: {
  categoryId?: number;
  take?: number;
  skip?: number;
}) {
  return prisma.product.findMany({
    where: {
      isActive: true,
      isGroupPrimary: true,
      removed: false,
      ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      category: true,
      group: true,
    },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: options?.take ?? 48,
    skip: options?.skip ?? 0,
  });
}

const productPageInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  category: true,
  group: true,
};

export async function resolveProduct(slug: string) {
  const include = productPageInclude;
  const bySlug = await prisma.product.findUnique({
    where: { slug },
    include,
  });
  if (bySlug?.isActive && !bySlug.removed) {
    return { kind: "ok" as const, product: bySlug };
  }

  const idFromEnd = slug.match(/-(\d+)$/);
  const id = /^\d+$/.test(slug)
    ? Number(slug)
    : idFromEnd
      ? Number(idFromEnd[1])
      : null;

  if (id) {
    const byId = await prisma.product.findUnique({
      where: { id },
      include,
    });
    if (byId?.isActive && !byId.removed) {
      if (byId.slug === slug) return { kind: "ok" as const, product: byId };
      return { kind: "redirect" as const, to: byId.slug };
    }
  }

  return null;
}
