"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

export type AccountNotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsView({ initial }: { initial: AccountNotificationItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [pending, setPending] = useState(false);

  const unread = items.some((item) => !item.readAt);

  async function markRead(id?: string) {
    setPending(true);
    try {
      const res = await fetch("/api/account/notifications/", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : {}),
      });
      if (!res.ok) return;
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) => (id && item.id !== id ? item : { ...item, readAt: item.readAt ?? now })),
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-line bg-white p-6 text-[14px] leading-relaxed text-[#555]">
        Henüz bildiriminiz yok. Favori ürünleriniz indirime girince burada görünür.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unread ? (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => void markRead()}
            className="h-9 rounded-md border border-line bg-white px-4 text-[12px] font-extrabold tracking-wide text-navy hover:bg-soft disabled:opacity-60"
          >
            Tümünü okundu işaretle
          </button>
        </div>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => {
          const inner = (
            <>
              <span
                className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md ${
                  item.readAt ? "bg-soft text-[#8b919a]" : "bg-[#eef3fb] text-navy"
                }`}
              >
                <Bell className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-[14px] ${item.readAt ? "font-semibold text-[#555]" : "font-extrabold text-navy"}`}>
                  {item.title}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-[#555]">{item.body}</span>
                <span className="mt-2 block text-[11px] text-[#8b919a]">
                  {new Date(item.createdAt).toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </span>
            </>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link
                  href={item.href}
                  onClick={() => {
                    if (!item.readAt) void markRead(item.id);
                  }}
                  className={`flex gap-3 rounded-md border p-4 hover:bg-soft ${
                    item.readAt ? "border-line bg-white" : "border-navy/20 bg-[#f7f9fd]"
                  }`}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!item.readAt) void markRead(item.id);
                  }}
                  className={`flex w-full gap-3 rounded-md border p-4 text-left hover:bg-soft ${
                    item.readAt ? "border-line bg-white" : "border-navy/20 bg-[#f7f9fd]"
                  }`}
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
