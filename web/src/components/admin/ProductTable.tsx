"use client";

import { useState } from "react";
import { CategoryEditor, DeleteConfirm, ProductEditor, type CatalogCategoryOption } from "@/components/admin/CatalogEditors";
import { ProductFamilyGrid, RowActions, type AdminFamily, type AdminVariant } from "@/components/admin/CatalogCards";

export function ProductTable({
  families,
  categories,
}: {
  families: AdminFamily[];
  categories: CatalogCategoryOption[];
}) {
  const [edit, setEdit] = useState<AdminVariant | null>(null);
  const [remove, setRemove] = useState<AdminVariant | null>(null);
  const [rows, setRows] = useState(families);

  function patchVariant(id: number, patch: Partial<AdminVariant>) {
    setRows((current) =>
      current.map((family) => ({
        ...family,
        variants: family.variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)),
      })),
    );
  }

  return (
    <>
      <ProductFamilyGrid
        families={rows}
        onEdit={setEdit}
        onDelete={setRemove}
        onToggled={patchVariant}
      />
      {edit ? <ProductEditor product={edit} categories={categories} onClose={() => setEdit(null)} /> : null}
      {remove ? (
        <DeleteConfirm
          title="Ürünü sil"
          message={`${remove.title || remove.name} (${[remove.color, remove.size].filter(Boolean).join(" · ") || "standart"}) siteden kalkar.`}
          href={`/api/admin/products/${remove.id}`}
          onClose={() => setRemove(null)}
        />
      ) : null}
    </>
  );
}

export function CategoryManageButtons({
  category,
  onEdited,
}: {
  category: { id: number; name: string; productCount: number };
  onEdited?: () => void;
}) {
  const [edit, setEdit] = useState(false);
  const [remove, setRemove] = useState(false);
  return (
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <RowActions onEdit={() => setEdit(true)} onDelete={() => setRemove(true)} />
      {edit ? (
        <CategoryEditor category={category} onClose={() => setEdit(false)} onSaved={onEdited} />
      ) : null}
      {remove ? (
        <DeleteConfirm
          title="Kategoriyi sil"
          message={`${category.name} ve içindeki ${category.productCount.toLocaleString("tr-TR")} ürün siteden kalkar.`}
          href={`/api/admin/categories/${category.id}`}
          onClose={() => setRemove(false)}
          onDeleted={onEdited}
        />
      ) : null}
    </div>
  );
}
