"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BankLogo } from "@/components/banks/BankLogo";
import { IbanInput } from "@/components/admin/IbanInput";
import { findTurkeyBankByName, formatIban, getTurkeyBank, searchTurkeyBanks, type TurkeyBank } from "@/data/turkey-banks";

const inputClass =
  "mt-1 h-11 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-navy";

export type SavedBankAccount = {
  id: string;
  displayName: string;
  holderName: string;
  iban: string;
  accountType: string;
  enabled: boolean;
};

export function BankAccountsPanel({ saved }: { saved: SavedBankAccount[] }) {
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<TurkeyBank | null>(null);
  const [iban, setIban] = useState("TR");
  const [holderName, setHolderName] = useState("ESER REKLAMCILIK");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const suggestions = useMemo(() => searchTurkeyBanks(query, 10), [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function fillFromSaved(bank: TurkeyBank) {
    const row = saved.find((item) => item.id === bank.id);
    setIban(row?.iban ? formatIban(row.iban) : "TR");
    setHolderName(row?.holderName.trim() ? row.holderName.toLocaleUpperCase("tr") : "ESER REKLAMCILIK");
  }

  function pick(bank: TurkeyBank) {
    setSelected(bank);
    setQuery(bank.short);
    setOpen(false);
    fillFromSaved(bank);
    setError(null);
    setMessage(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const bank = selected ?? findTurkeyBankByName(query);
    if (!bank) {
      setError("Listeden bir banka seçin.");
      setOpen(true);
      return;
    }
    if (!selected) {
      setSelected(bank);
      setQuery(bank.short);
      setOpen(false);
    }
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/banks/${bank.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: true,
          displayName: bank.short,
          holderName: holderName.trim().toLocaleUpperCase("tr") || "ESER REKLAMCILIK",
          iban,
          accountType: "Vadesiz TL",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Kaydedilemedi");
        return;
      }
      setMessage(`${bank.short} hesabı kaydedildi. Müşteri yalnızca bunu görür.`);
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/banks/${id}/`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || "Silinemedi");
        return;
      }
      if (selected?.id === id) {
        setSelected(null);
        setQuery("");
        setIban("TR");
        setHolderName("ESER REKLAMCILIK");
      }
      setMessage("Hesap kaldırıldı.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setPending(false);
    }
  }

  const ready = saved.filter((row) => row.enabled && row.iban && row.holderName);

  return (
    <div className="space-y-5">
      <form onSubmit={(e) => void save(e)} className="max-w-xl space-y-3 rounded-md border border-line bg-white p-5">
        <div ref={boxRef} className="relative">
          <label className="block text-[12px] font-bold text-[#555]">
            Banka adı
            <span className="mt-1 flex items-center gap-2">
              {selected ? <BankLogo id={selected.id} size={40} /> : null}
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                  setSelected(null);
                  setMessage(null);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Banka adı yazın, örn. ING"
                autoComplete="off"
                className={`${inputClass} mt-0 ${selected ? "flex-1" : "w-full"}`}
              />
            </span>
          </label>
          {open ? (
            <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-line bg-white shadow-lg">
              {suggestions.length === 0 ? (
                <li className="px-3 py-3 text-[13px] text-[#6b7280]">Eşleşen banka yok</li>
              ) : (
                suggestions.map((bank) => (
                  <li key={bank.id}>
                    <button
                      type="button"
                      onClick={() => pick(bank)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-soft"
                    >
                      <BankLogo id={bank.id} size={36} />
                      <span>
                        <span className="block text-[13px] font-extrabold text-navy">{bank.short}</span>
                        <span className="block text-[11px] text-[#6b7280]">{bank.name}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        <label className="block text-[12px] font-bold text-[#555]">
          IBAN No
          <IbanInput value={iban} onChange={setIban} />
        </label>

        <label className="block text-[12px] font-bold text-[#555]">
          Alıcı / şirket adı
          <input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value.toLocaleUpperCase("tr"))}
            required
            placeholder="ESER REKLAMCILIK"
            className={`${inputClass} uppercase`}
          />
        </label>

        <label className="block text-[12px] font-bold text-[#555]">
          Hesap türü
          <input value="Vadesiz TL" readOnly className={`${inputClass} bg-soft`} />
        </label>

        {error ? <p className="text-[13px] text-brand-red">{error}</p> : null}
        {message ? <p className="text-[13px] text-brand-green">{message}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-md bg-navy px-5 text-[13px] font-extrabold tracking-wide text-white hover:bg-navy-deep disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Kaydet"}
        </button>
      </form>

      <section className="max-w-xl overflow-hidden rounded-md border border-line bg-white">
        <h2 className="border-b border-line bg-soft px-4 py-2.5 text-[12px] font-extrabold tracking-wide text-[#6b7280] uppercase">
          Kayıtlı hesaplar
          {ready.length ? ` · ${ready.length} müşteride açık` : ""}
        </h2>
        {saved.length === 0 ? (
          <p className="px-4 py-4 text-[13px] text-[#6b7280]">Henüz hesap yok. Yukarıdan banka seçip kaydedin.</p>
        ) : (
          <ul className="divide-y divide-line">
            {saved.map((row) => (
              <li key={row.id} className="flex items-center gap-3 px-4 py-3">
                <BankLogo id={row.id} size={40} />
                <button
                  type="button"
                  onClick={() => {
                    const bank = getTurkeyBank(row.id);
                    if (bank) pick(bank);
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-[13px] font-extrabold text-navy">{row.displayName}</p>
                  <p className="text-[12px] text-[#6b7280]">
                    {row.holderName || "Alıcı girilmedi"}
                    {row.iban ? ` · ${formatIban(row.iban)}` : ""}
                  </p>
                </button>
                {row.enabled && row.iban && row.holderName ? (
                  <span className="hidden text-[11px] font-extrabold text-[#1f9d55] sm:inline">Açık</span>
                ) : null}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void remove(row.id)}
                  className="shrink-0 text-[12px] font-bold text-brand-red hover:underline disabled:opacity-50"
                >
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
