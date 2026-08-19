"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

const inputClass =
  "mt-1 h-11 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-navy";

export type CatalogCategoryOption = { id: number; name: string };

export type ProductDraft = {
  id: number;
  name: string;
  title: string | null;
  description?: string | null;
  sku: string;
  color: string | null;
  size: string | null;
  price: number;
  vatRate?: number;
  stockTotal: number;
  categoryId?: number;
  isActive: boolean;
  showOnHomepage: boolean;
};

export function ProductEditor({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: ProductDraft;
  categories: CatalogCategoryOption[];
  onClose: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: product.name,
    title: product.title ?? "",
    description: product.description ?? "",
    sku: product.sku,
    color: product.color ?? "",
    size: product.size ?? "",
    price: String(product.price),
    vatRate: String(product.vatRate ?? 20),
    stockTotal: String(product.stockTotal),
    categoryId: String(product.categoryId ?? categories[0]?.id ?? ""),
  });

  useEffect(() => {
    if (product.description !== undefined) return;
    void fetch(`/api/admin/products/${product.id}/`, { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data: ProductDraft) => {
        setForm((current) => ({
          ...current,
          description: data.description ?? "",
          vatRate: String(data.vatRate ?? 20),
          categoryId: String(data.categoryId ?? current.categoryId),
        }));
      })
      .catch(() => undefined);
  }, [product.description, product.id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price.replace(",", "."));
    const vatRate = Number(form.vatRate.replace(",", "."));
    const stockTotal = Number(form.stockTotal);
    const categoryId = Number(form.categoryId);
    if (!form.name.trim() || !Number.isFinite(price) || price <= 0) {
      setError("Ad ve fiyat gerekli.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          title: form.title.trim() || null,
          description: form.description.trim() || null,
          sku: form.sku.trim(),
          color: form.color.trim() || null,
          size: form.size.trim() || null,
          price,
          vatRate: Number.isFinite(vatRate) ? vatRate : 20,
          stockTotal: Number.isInteger(stockTotal) ? stockTotal : 0,
          categoryId: Number.isInteger(categoryId) ? categoryId : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi");
        return;
      }
      onSaved?.();
      router.refresh();
      onClose();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <EditorShell title="Ürünü düzenle" onClose={onClose}>
      <form onSubmit={(e) => void save(e)} className="space-y-3">
        <Field label="Ürün adı">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Başlık">
          <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="SKU">
            <input className={inputClass} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </Field>
          <Field label="Kategori">
            <select
              className={inputClass}
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Renk">
            <input className={inputClass} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </Field>
          <Field label="Ebat">
            <input className={inputClass} value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
          </Field>
          <Field label="Fiyat (KDV hariç)">
            <input className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </Field>
          <Field label="KDV %">
            <input className={inputClass} value={form.vatRate} onChange={(e) => setForm({ ...form, vatRate: e.target.value })} />
          </Field>
          <Field label="Stok">
            <input
              className={inputClass}
              value={form.stockTotal}
              onChange={(e) => setForm({ ...form, stockTotal: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Açıklama">
          <textarea
            rows={5}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-navy"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        {error ? <p className="text-[13px] text-brand-red">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-11 rounded-md border border-line px-4 text-[13px] font-bold">
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-md bg-navy px-5 text-[13px] font-extrabold text-white disabled:opacity-50"
          >
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </EditorShell>
  );
}

export function CategoryEditor({
  category,
  onClose,
  onSaved,
}: {
  category: { id: number; name: string; description?: string | null; sortOrder?: number };
  onClose: () => void;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: category.name,
    description: category.description ?? "",
    sortOrder: String(category.sortOrder ?? 0),
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const sortOrder = Number(form.sortOrder);
    if (!form.name.trim()) {
      setError("Kategori adı gerekli.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
          sortOrder: Number.isInteger(sortOrder) ? sortOrder : 0,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi");
        return;
      }
      onSaved?.();
      router.refresh();
      onClose();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <EditorShell title="Kategoriyi düzenle" onClose={onClose}>
      <form onSubmit={(e) => void save(e)} className="space-y-3">
        <Field label="Kategori adı">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Sıra">
          <input
            className={inputClass}
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
          />
        </Field>
        <Field label="Açıklama">
          <textarea
            rows={4}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-[13px] outline-none focus:border-navy"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        {error ? <p className="text-[13px] text-brand-red">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-11 rounded-md border border-line px-4 text-[13px] font-bold">
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-md bg-navy px-5 text-[13px] font-extrabold text-white disabled:opacity-50"
          >
            {pending ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </EditorShell>
  );
}

export function DeleteConfirm({
  title,
  message,
  href,
  onClose,
  onDeleted,
}: {
  title: string;
  message: string;
  href: string;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(href.endsWith("/") ? href : `${href}/`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Silinemedi");
        return;
      }
      onDeleted?.();
      router.refresh();
      onClose();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  return (
    <EditorShell title={title} onClose={onClose}>
      <p className="text-[14px] text-[#374151]">{message}</p>
      {error ? <p className="mt-3 text-[13px] text-brand-red">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-11 rounded-md border border-line px-4 text-[13px] font-bold">
          Vazgeç
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void remove()}
          className="h-11 rounded-md bg-brand-red px-5 text-[13px] font-extrabold text-white disabled:opacity-50"
        >
          {pending ? "Siliniyor…" : "Sil"}
        </button>
      </div>
    </EditorShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-bold tracking-wide text-[#6b7280] uppercase">
      {label}
      {children}
    </label>
  );
}

function EditorShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div className="max-h-[90dvh] w-full max-w-2xl overflow-auto rounded-md border border-line bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-[16px] font-extrabold tracking-wide text-navy uppercase">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-md border border-line"
            aria-label="Kapat"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
