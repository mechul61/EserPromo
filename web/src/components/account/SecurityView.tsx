"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type LoginHistoryItem = {
  id: string;
  email: string;
  at: string;
  device: string;
  ip: string;
  source: string;
};

function HistoryList({
  items,
  empty,
  showEmail,
}: {
  items: LoginHistoryItem[];
  empty: string;
  showEmail?: boolean;
}) {
  if (items.length === 0) {
    return <p className="px-1 py-3 text-[12px] text-[#8b919a]">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.id} className="py-2.5">
          {showEmail ? (
            <p className="text-[13px] font-semibold text-[#111]">{item.email}</p>
          ) : null}
          <p className="text-[13px] font-semibold text-[#111]">{item.at}</p>
          <p className="mt-0.5 text-[12px] text-[#6b7280]">
            {item.source === "register" ? "Üyelik / ilk giriş · " : ""}
            {item.device}
            {item.ip ? ` · ${item.ip}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}

function ExpandRow({
  label,
  value,
  open,
  onToggle,
  children,
}: {
  label: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-2 text-left"
      >
        <span className="text-[#6b7280]">{label}</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#111]">
          {value}
          <ChevronDown
            className={`size-4 text-[#8b919a] transition ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>
      {open ? <div className="pb-3">{children}</div> : null}
    </div>
  );
}

export function SecurityView({
  email,
  lastLogin,
  memberSince,
  events,
}: {
  email: string;
  lastLogin: string;
  memberSince: string;
  events: LoginHistoryItem[];
}) {
  const [open, setOpen] = useState<"email" | "login" | null>(null);

  function toggle(key: "email" | "login") {
    setOpen((current) => (current === key ? null : key));
  }

  return (
    <section className="rounded-md border border-line bg-white p-5 text-[13px]">
      <dl>
        <ExpandRow
          label="E-posta"
          value={email}
          open={open === "email"}
          onToggle={() => toggle("email")}
        >
          <p className="mb-1 text-[12px] font-semibold text-navy">Bu e-posta ile girişler</p>
          <HistoryList
            items={events}
            showEmail
            empty="Bu e-posta ile henüz kayıtlı bir giriş yok."
          />
        </ExpandRow>
        <ExpandRow
          label="Son giriş"
          value={lastLogin}
          open={open === "login"}
          onToggle={() => toggle("login")}
        >
          <p className="mb-1 text-[12px] font-semibold text-navy">Önceki girişler</p>
          <HistoryList items={events} empty="Henüz kayıtlı bir giriş geçmişi yok." />
        </ExpandRow>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-[#6b7280]">Üyelik tarihi</dt>
          <dd className="font-semibold">{memberSince}</dd>
        </div>
      </dl>
    </section>
  );
}
