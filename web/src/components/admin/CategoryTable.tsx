"use client";

import { FolderOpen } from "lucide-react";
import { ActiveToggle } from "@/components/admin/ActiveToggle";
import { CategoryManageButtons } from "@/components/admin/ProductTable";

export type AdminCategoryRow = {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  showOnHomepage: boolean;
};

export function CategoryTable({ categories }: { categories: AdminCategoryRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <article key={category.id} className="overflow-hidden rounded-md border border-line bg-white">
          <div className="flex items-start gap-3 p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-[#eef3fb] text-navy">
              <FolderOpen className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-navy">{category.name}</p>
              <p className="mt-1 text-[12px] text-[#6b7280]">{category.productCount.toLocaleString("tr-TR")} ürün</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-3">
            <ActiveToggle
              href={`/api/admin/categories/${category.id}/`}
              active={category.showOnHomepage}
              activeLabel="Göster"
              inactiveLabel="Gizli"
            />
            <CategoryManageButtons category={category} />
          </div>
        </article>
      ))}
    </div>
  );
}
