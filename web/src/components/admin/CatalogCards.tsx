"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { formatPriceTry, mediaUrl } from "@/lib/media";
import { productPath } from "@/lib/seo/urls";
import type { ProductDraft } from "@/components/admin/CatalogEditors";

export type AdminVariant = ProductDraft & {
  slug: string;
  skuGroup: string;
  isGroupPrimary: boolean;
  image: string | null;
  categoryName?: string;
};

export type AdminFamily = {
  skuGroup: string;
  name: string;
  categoryId: number;
  categoryName: string;
  variants: AdminVariant[];
};

function variantLabel(product: { color: string | null; size: string | null }) {
  return [product.color, product.size].filter(Boolean).join(" · ") || "Standart";
}

export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-md border border-line px-2.5 py-1 text-[11px] font-extrabold text-navy hover:border-orange"
      >
        Düzenle
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-md border border-line px-2.5 py-1 text-[11px] font-extrabold text-brand-red hover:border-brand-red"
      >
        Sil
      </button>
    </div>
  );
}

export function familyFromVariants(variants: AdminVariant[], fallbackCategory: { id: number; name: string }): AdminFamily[] {
  const map = new Map<string, AdminVariant[]>();
  for (const variant of variants) {
    const key = variant.skuGroup || variant.sku;
    const list = map.get(key) ?? [];
    list.push(variant);
    map.set(key, list);
  }
  return [...map.entries()].map(([skuGroup, items]) => {
    const primary = items.find((item) => item.isGroupPrimary) ?? items[0];
    return {
      skuGroup,
      name: primary.title || primary.name,
      categoryId: primary.categoryId ?? fallbackCategory.id,
      categoryName: primary.categoryName ?? fallbackCategory.name,
      variants: items,
    };
  });
}

export function ProductFamilyGrid({
  families,
  onEdit,
  onDelete,
  onToggled,
}: {
  families: AdminFamily[];
  onEdit: (product: AdminVariant) => void;
  onDelete: (product: AdminVariant) => void;
  onToggled?: (id: number, patch: Partial<AdminVariant>) => void;
}) {
  if (families.length === 0) {
    return <p className="rounded-md border border-line bg-white p-5 text-[13px] text-[#6b7280]">Ürün yok.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {families.map((family) => (
        <FamilyCard
          key={family.skuGroup}
          family={family}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggled={onToggled}
        />
      ))}
    </div>
  );
}

function FamilyCard({
  family,
  onEdit,
  onDelete,
  onToggled,
}: {
  family: AdminFamily;
  onEdit: (product: AdminVariant) => void;
  onDelete: (product: AdminVariant) => void;
  onToggled?: (id: number, patch: Partial<AdminVariant>) => void;
}) {
  const [open, setOpen] = useState(false);
  const primary = family.variants.find((item) => item.isGroupPrimary) ?? family.variants[0];
  const extra = family.variants.length - 1;
  const image = mediaUrl(primary.image) ?? "/brand/logo.png";
  const stock = family.variants.reduce((sum, item) => sum + item.stockTotal, 0);

  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-line bg-white">
      <div className="flex gap-3 p-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-soft">
          <Image src={image} alt="" fill unoptimized className="object-cover" sizes="80px" />
        </div>
        <div className="min-w-0 flex-1">
          <Link href={productPath(primary.slug)} className="line-clamp-2 text-[13px] font-extrabold text-navy hover:text-orange">
            {family.name}
          </Link>
          <p className="mt-1 text-[12px] text-[#6b7280]">{family.categoryName}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {extra > 0 ? (
              <span className="rounded bg-[#eef3fb] px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-navy uppercase">
                {family.variants.length} varyant
              </span>
            ) : (
              <span className="rounded bg-soft px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#6b7280] uppercase">
                Tek ürün
              </span>
            )}
            {primary.isGroupPrimary && extra > 0 ? (
              <span className="rounded bg-[#fff4e0] px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-[#b45309] uppercase">
                Ana
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-t border-line px-3 py-2">
        {family.variants.slice(0, 6).map((variant) => (
          <span key={variant.id} className="rounded-md border border-line bg-soft px-2 py-0.5 text-[11px] font-semibold text-navy">
            {variantLabel(variant)}
          </span>
        ))}
        {family.variants.length > 6 ? (
          <span className="px-1 text-[11px] text-[#6b7280]">+{family.variants.length - 6}</span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-3 py-2 text-[12px]">
        <span className="font-extrabold text-navy">₺{formatPriceTry(primary.price)}</span>
        <span className="text-[#6b7280]">{stock.toLocaleString("tr-TR")} stok</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
        <ActiveToggle
          href={`/api/admin/products/${primary.id}`}
          field="showOnHomepage"
          active={primary.showOnHomepage}
          activeLabel="Göster"
          inactiveLabel="Gizli"
          onToggled={(next) => onToggled?.(primary.id, { showOnHomepage: next })}
        />
        <ActiveToggle
          href={`/api/admin/products/${primary.id}`}
          active={primary.isActive}
          onToggled={(next) => onToggled?.(primary.id, { isActive: next })}
        />
        <RowActions onEdit={() => onEdit(primary)} onDelete={() => onDelete(primary)} />
      </div>

      {extra > 0 ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center justify-center gap-1 border-t border-line bg-soft px-3 py-2 text-[12px] font-bold text-navy hover:text-orange"
          >
            <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} />
            {open ? "Varyantları gizle" : "Varyantları göster"}
          </button>
          {open ? (
            <ul className="grid grid-cols-1 gap-2 border-t border-line bg-[#f7f8fa] p-2 sm:grid-cols-2">
              {family.variants.map((variant) => (
                <li key={variant.id} className="rounded-md border border-line bg-white p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-extrabold text-navy">{variantLabel(variant)}</p>
                      <p className="text-[11px] text-[#6b7280]">{variant.sku}</p>
                    </div>
                    {variant.isGroupPrimary ? (
                      <span className="rounded bg-[#fff4e0] px-1.5 py-0.5 text-[10px] font-extrabold text-[#b45309] uppercase">
                        Ana
                      </span>
                    ) : (
                      <span className="rounded bg-[#eef3fb] px-1.5 py-0.5 text-[10px] font-extrabold text-navy uppercase">
                        Varyant
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[12px]">
                    <span className="font-extrabold">₺{formatPriceTry(variant.price)}</span>
                    <span className="text-[#6b7280]"> · {variant.stockTotal.toLocaleString("tr-TR")} stok</span>
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ActiveToggle
                      href={`/api/admin/products/${variant.id}`}
                      field="showOnHomepage"
                      active={variant.showOnHomepage}
                      activeLabel="Göster"
                      inactiveLabel="Gizli"
                      onToggled={(next) => onToggled?.(variant.id, { showOnHomepage: next })}
                    />
                    <ActiveToggle
                      href={`/api/admin/products/${variant.id}`}
                      active={variant.isActive}
                      onToggled={(next) => onToggled?.(variant.id, { isActive: next })}
                    />
                    <RowActions onEdit={() => onEdit(variant)} onDelete={() => onDelete(variant)} />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <p className="border-t border-line px-3 py-2 text-[11px] text-[#6b7280]">
          Bu kayıt tek başına satılır; renk/ebat varyantı yok.
        </p>
      )}
    </article>
  );
}
