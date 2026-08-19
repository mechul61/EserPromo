"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SUPPORT_CATEGORY_LABEL,
  SUPPORT_STATUS_LABEL,
  type SupportCategoryId,
  type SupportStatusId,
} from "@/lib/commerce/support-copy";

export type AccountSupportMessage = {
  id: string;
  author: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type AccountSupportTicket = {
  id: string;
  publicNumber: string;
  subject: string;
  category: SupportCategoryId;
  status: SupportStatusId;
  rating: number | null;
  createdAt: string;
  messages: AccountSupportMessage[];
};

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SupportTicketsView({ tickets }: { tickets: AccountSupportTicket[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState(tickets[0]?.id ?? "");
  const [createOpen, setCreateOpen] = useState(tickets.length === 0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({
    subject: "",
    body: "",
    category: "other" as SupportCategoryId,
    phone: "",
  });

  const selected = tickets.find((row) => row.id === openId) ?? null;
  const canReply = selected && selected.status !== "resolved" && selected.status !== "archived";

  async function createTicket() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/account/support/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Talep oluşturulamadı.");
        return;
      }
      setCreateOpen(false);
      setForm({ subject: "", body: "", category: "other", phone: "" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function sendReply() {
    if (!selected) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/support/${selected.id}/messages/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Yanıt gönderilemedi.");
        return;
      }
      setReply("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function rate(value: number) {
    if (!selected) return;
    setPending(true);
    try {
      await fetch(`/api/account/support/${selected.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreateOpen((v) => !v)}
          className="h-10 rounded-md bg-navy px-4 text-[12px] font-extrabold tracking-wide text-white"
        >
          {createOpen ? "Listeye dön" : "Yeni talep aç"}
        </button>
      </div>

      {createOpen ? (
        <div className="rounded-md border border-line bg-white p-5">
          <h2 className="text-[15px] font-extrabold text-navy">Yeni destek talebi</h2>
          <div className="mt-4 grid gap-3">
            <label className="block text-[13px] font-semibold text-navy">
              Konu
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm" />
            </label>
            <label className="block text-[13px] font-semibold text-navy">
              Kategori
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SupportCategoryId })} className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm">
                {Object.entries(SUPPORT_CATEGORY_LABEL).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </label>
            <label className="block text-[13px] font-semibold text-navy">
              Telefon (isteğe bağlı)
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 h-11 w-full rounded-md border border-line px-3 text-sm" />
            </label>
            <label className="block text-[13px] font-semibold text-navy">
              Mesaj
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm" />
            </label>
          </div>
          {error ? <p className="mt-3 text-[13px] font-semibold text-brand-red">{error}</p> : null}
          <button type="button" disabled={pending} onClick={() => void createTicket()} className="mt-4 h-10 rounded-md bg-navy px-4 text-[13px] font-extrabold text-white disabled:opacity-60">
            {pending ? "Gönderiliyor…" : "Gönder"}
          </button>
        </div>
      ) : null}

      {tickets.length === 0 && !createOpen ? (
        <div className="rounded-md border border-line bg-white p-6 text-[14px] text-[#555]">Henüz destek talebiniz yok.</div>
      ) : null}

      {tickets.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <ul className="space-y-2">
            {tickets.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(row.id);
                    setCreateOpen(false);
                  }}
                  className={`w-full rounded-md border px-4 py-3 text-left ${openId === row.id ? "border-navy bg-[#fff8f0]" : "border-line bg-white"}`}
                >
                  <p className="text-[12px] font-extrabold text-navy">#{row.publicNumber}</p>
                  <p className="mt-1 text-[14px] font-bold text-[#222]">{row.subject}</p>
                  <p className="mt-1 text-[12px] text-[#6b7280]">
                    {SUPPORT_STATUS_LABEL[row.status]} · {SUPPORT_CATEGORY_LABEL[row.category]} · {fmtWhen(row.createdAt)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {selected && !createOpen ? (
            <section className="rounded-md border border-line bg-white p-4">
              <p className="text-[12px] font-extrabold text-navy">#{selected.publicNumber}</p>
              <h2 className="mt-1 text-[16px] font-extrabold">{selected.subject}</h2>
              <p className="mt-1 text-[12px] text-[#6b7280]">{SUPPORT_STATUS_LABEL[selected.status]}</p>
              <ul className="mt-4 space-y-3">
                {selected.messages.map((item) => (
                  <li key={item.id} className="rounded-md bg-soft p-3">
                    <p className="text-[12px] font-bold">{item.author === "admin" ? "Eser Promo" : item.authorName} · {fmtWhen(item.createdAt)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[#444]">{item.body}</p>
                  </li>
                ))}
              </ul>
              {canReply ? (
                <div className="mt-4">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Yanıtınız..." className="w-full rounded-md border border-line px-3 py-2 text-sm" />
                  {error ? <p className="mt-2 text-[13px] font-semibold text-brand-red">{error}</p> : null}
                  <button type="button" disabled={pending || reply.trim().length < 2} onClick={() => void sendReply()} className="mt-2 h-10 w-full rounded-md bg-navy text-[13px] font-extrabold text-white disabled:opacity-60">
                    Yanıt gönder
                  </button>
                </div>
              ) : null}
              {selected.status === "resolved" && !selected.rating ? (
                <div className="mt-4">
                  <p className="text-[12px] font-bold text-navy">Destek sürecini puanlayın</p>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" disabled={pending} onClick={() => void rate(n)} className="h-9 w-9 rounded-md border border-line text-[13px] font-bold hover:bg-soft">
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {selected.rating ? <p className="mt-3 text-[12px] font-semibold">Puanınız: {selected.rating}/5</p> : null}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
