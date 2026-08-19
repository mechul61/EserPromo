"use client";

import Link from "next/link";
import { useState } from "react";
import type { CookieConsent } from "@/lib/commerce/cookie-consent";

type Props = {
  initial: Pick<CookieConsent, "analytics" | "marketing">;
  onSave: (values: Pick<CookieConsent, "analytics" | "marketing">) => Promise<void>;
  showActions?: boolean;
  compact?: boolean;
};

export function CookiePreferencesPanel({ initial, onSave, showActions = true, compact = false }: Props) {
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [marketing, setMarketing] = useState(initial.marketing);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next?: Pick<CookieConsent, "analytics" | "marketing">) {
    setSaving(true);
    setError(null);
    setSaved(false);
    const values = next ?? { analytics, marketing };
    try {
      await onSave(values);
      setAnalytics(values.analytics);
      setMarketing(values.marketing);
      setSaved(true);
    } catch {
      setError("Tercihler kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={compact ? "space-y-4" : "rounded-md border border-line bg-white p-5 sm:p-6"}>
      {!compact ? (
        <p className="text-[13px] leading-relaxed text-[#555]">
          Zorunlu çerezler site ve alışveriş işlevleri için her zaman etkindir. Aşağıdaki tercihlerle isteğe bağlı
          çerezleri yönetebilirsiniz. Ayrıntılar için{" "}
          <Link href="/cerez-politikasi/" className="font-semibold text-navy underline underline-offset-2">
            Çerez Politikası
          </Link>{" "}
          sayfasına bakın.
        </p>
      ) : null}

      <div className="space-y-3">
        <PreferenceRow
          title="Zorunlu çerezler"
          description="Oturum, sepet, güvenlik ve temel site işlevleri için gereklidir."
          checked
          disabled
        />
        <PreferenceRow
          title="Performans / analitik"
          description="Ziyaret istatistikleri ve site kullanımını anlamamıza yardımcı olur."
          checked={analytics}
          onChange={setAnalytics}
        />
        <PreferenceRow
          title="Pazarlama"
          description="Kişiselleştirilmiş kampanya ve reklam deneyimi için kullanılabilir."
          checked={marketing}
          onChange={setMarketing}
        />
      </div>

      {error ? <p className="text-[13px] text-red-600">{error}</p> : null}
      {saved ? <p className="text-[13px] font-semibold text-navy">Tercihleriniz kaydedildi.</p> : null}

      {showActions ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-md bg-navy px-4 py-2.5 text-[13px] font-extrabold text-white hover:bg-[#0a2540] disabled:opacity-60"
          >
            {saving ? "Kaydediliyor…" : "Tercihleri Kaydet"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save({ analytics: true, marketing: true })}
            className="rounded-md border border-line bg-white px-4 py-2.5 text-[13px] font-extrabold text-navy hover:bg-soft disabled:opacity-60"
          >
            Tümünü Kabul Et
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-md border border-line px-4 py-3 ${
        disabled ? "bg-[#f8fafc]" : "bg-white"
      }`}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 accent-orange"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-extrabold text-[#111]">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-relaxed text-[#6b7280]">{description}</span>
      </span>
    </label>
  );
}
