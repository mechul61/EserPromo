"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FolderTree,
  Image as ImageIcon,
  Loader2,
  Package,
  Play,
  RefreshCw,
  Save,
  Search,
  ShoppingBag,
  Timer,
  TrendingUp,
  X,
} from "lucide-react";
import type { ScheduledJobType, SyncSchedule } from "@/lib/etkin/sync-schedule";

type SyncRun = {
  id: number;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  requestCount: number;
  categoriesUpsert: number;
  productsUpserted: number;
  imagesDownloaded: number;
  errorMessage: string | null;
};

type JobAction = "full" | "categories" | "products" | "single_product" | "stock_prices";
type ScheduleDecision = { due: true } | { due: false; reason: string };

const JOBS: Array<{
  action: JobAction;
  label: string;
  description: string;
  icon: typeof Database;
  color: string;
}> = [
  {
    action: "full",
    label: "Tam Senkronizasyon",
    description: "Yeni kategoriler + tüm ürünler (mevcut kategoriler korunur)",
    icon: Database,
    color: "bg-[#2f6bff] text-white",
  },
  {
    action: "categories",
    label: "Sadece Kategoriler",
    description: "Yalnızca sitede olmayan yeni kategorileri ekler; mevcutları değiştirmez",
    icon: FolderTree,
    color: "bg-[#8b5cf6] text-white",
  },
  {
    action: "products",
    label: "Tüm Ürünler",
    description: "Ürünleri çeker; eksik kategori varsa minimal ekler, mevcut kategorilere dokunmaz",
    icon: ShoppingBag,
    color: "bg-[#059669] text-white",
  },
  {
    action: "stock_prices",
    label: "Stok & Fiyat Güncelle",
    description: "Sadece stok miktarları ve fiyatlar güncellenir (hızlı)",
    icon: TrendingUp,
    color: "bg-[#d97706] text-white",
  },
];

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function elapsed(start: string, end: string | null) {
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}sn`;
  const m = Math.floor(s / 60);
  return `${m}dk ${s % 60}sn`;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; label: string }> = {
    running: { bg: "bg-[#fef3c7] text-[#d97706]", label: "Çalışıyor" },
    success: { bg: "bg-[#d1fae5] text-[#059669]", label: "Başarılı" },
    failed: { bg: "bg-[#fee2e2] text-[#dc2626]", label: "Hatalı" },
  };
  const s = map[status] ?? { bg: "bg-[#f1f5f9] text-[#64748b]", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.bg}`}>
      {status === "running" ? <Loader2 className="size-3 animate-spin" /> : null}
      {status === "success" ? <CheckCircle2 className="size-3" /> : null}
      {status === "failed" ? <AlertCircle className="size-3" /> : null}
      {s.label}
    </span>
  );
}

export function SyncPageView({
  initialRuns,
  initialSchedule,
  initialDecision,
}: {
  initialRuns: SyncRun[];
  initialSchedule: SyncSchedule;
  initialDecision: ScheduleDecision;
}) {
  const router = useRouter();
  const [runs, setRuns] = useState(initialRuns);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string; runId?: number } | null>(null);
  const [singleId, setSingleId] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [decision, setDecision] = useState(initialDecision);
  const [schedulePending, setSchedulePending] = useState(false);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  function patchSchedule<K extends keyof SyncSchedule>(key: K, value: SyncSchedule[K]) {
    setScheduleNotice(null);
    setScheduleError(null);
    setSchedule((prev) => ({ ...prev, [key]: value }));
  }

  async function saveSchedule() {
    setSchedulePending(true);
    setScheduleNotice(null);
    setScheduleError(null);
    try {
      const res = await fetch("/api/admin/sync/schedule/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: schedule.enabled,
          intervalMinutes: schedule.intervalMinutes,
          quietStartHour: schedule.quietStartHour,
          quietEndHour: schedule.quietEndHour,
          jobType: schedule.jobType,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        schedule?: SyncSchedule;
      };
      if (!res.ok || !data.schedule) {
        setScheduleError(data.error || "Zamanlama kaydedilemedi");
        return;
      }
      setSchedule(data.schedule);
      const check = await fetch("/api/admin/sync/schedule/");
      const checkData = (await check.json()) as {
        schedule?: SyncSchedule;
        nextDecision?: { due: boolean; reason?: string };
      };
      if (checkData.schedule) setSchedule(checkData.schedule);
      if (checkData.nextDecision) {
        setDecision(
          checkData.nextDecision.due
            ? { due: true }
            : { due: false, reason: checkData.nextDecision.reason || "" },
        );
      }
      setScheduleNotice("Otomatik senkron ayarları kaydedildi.");
      router.refresh();
    } catch {
      setScheduleError("Zamanlama kaydedilemedi");
    } finally {
      setSchedulePending(false);
    }
  }

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/sync/");
      const data = (await res.json()) as { runs: SyncRun[]; isRunning: boolean };
      setRuns(data.runs);
      if (!data.isRunning && running) {
        setRunning(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch { /* ignore */ }
  }, [running]);

  useEffect(() => {
    if (running) {
      pollRef.current = setInterval(refresh, 3000);
      return () => clearInterval(pollRef.current);
    }
  }, [running, refresh]);

  async function startJob(action: JobAction) {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/sync/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; runId?: number };
      setResult(data);
      setRunning(false);
      void refresh();
      router.refresh();
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : "Bağlantı hatası" });
      setRunning(false);
    }
  }

  async function fetchSingle() {
    const id = Number(singleId.trim());
    if (!id || id <= 0) return;
    setSingleLoading(true);
    setSingleResult(null);
    try {
      const res = await fetch("/api/admin/sync/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "single_product", productId: id }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      setSingleResult(data);
      void refresh();
      router.refresh();
    } catch (error) {
      setSingleResult({ ok: false, error: error instanceof Error ? error.message : "Bağlantı hatası" });
    } finally {
      setSingleLoading(false);
    }
  }

  const hasRunning = runs.some((r) => r.status === "running");

  return (
    <div className="space-y-6">
      {/* OTOMATİK ZAMANLAMA */}
      <section className="rounded-xl border border-[#e8edf3] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[14px] font-extrabold tracking-wide text-[#1e293b] uppercase">
              <Timer className="size-4 text-[#2f6bff]" />
              Otomatik Senkron
            </h2>
            <p className="mt-1 text-[12px] text-[#6b7280]">
              Saat aralığı ve sıklık buradan yönetilir. Gece sessiz saatlerde çalışmaz. Mevcut
              kategoriler ve anasayfa seçimleriniz senkron sırasında korunur; yalnızca yeni kategoriler
              eklenir.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0f172a]">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) => patchSchedule("enabled", e.target.checked)}
              className="size-4 rounded border-[#cbd5e1]"
            />
            Aktif
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="block text-[12px] font-semibold text-[#64748b]">
            Aralık (dakika)
            <input
              type="number"
              min={15}
              max={1440}
              step={15}
              value={schedule.intervalMinutes}
              onChange={(e) => patchSchedule("intervalMinutes", Number(e.target.value) || 60)}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#dbe3ee] bg-[#f8fafc] px-3 text-[13px] outline-none"
            />
          </label>
          <label className="block text-[12px] font-semibold text-[#64748b]">
            İşlem türü
            <select
              value={schedule.jobType}
              onChange={(e) => patchSchedule("jobType", e.target.value as ScheduledJobType)}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#dbe3ee] bg-[#f8fafc] px-3 text-[13px] outline-none"
            >
              <option value="stock_prices">Stok &amp; Fiyat (önerilen, saatlik)</option>
              <option value="products">Tüm Ürünler</option>
              <option value="categories">Kategoriler</option>
              <option value="full">Tam Senkron</option>
            </select>
          </label>
          <label className="block text-[12px] font-semibold text-[#64748b]">
            Sessiz başlangıç (saat)
            <input
              type="number"
              min={0}
              max={23}
              value={schedule.quietStartHour}
              onChange={(e) => patchSchedule("quietStartHour", Number(e.target.value) || 0)}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#dbe3ee] bg-[#f8fafc] px-3 text-[13px] outline-none"
            />
          </label>
          <label className="block text-[12px] font-semibold text-[#64748b]">
            Sessiz bitiş (saat, hariç)
            <input
              type="number"
              min={0}
              max={23}
              value={schedule.quietEndHour}
              onChange={(e) => patchSchedule("quietEndHour", Number(e.target.value) || 0)}
              className="mt-1.5 h-10 w-full rounded-lg border border-[#dbe3ee] bg-[#f8fafc] px-3 text-[13px] outline-none"
            />
            <span className="mt-1 block text-[11px] font-medium text-[#94a3b8]">
              Varsayılan 0–8 → 00:00–07:59 çalışmaz
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={schedulePending}
            onClick={() => void saveSchedule()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2f6bff] px-4 text-[12px] font-bold text-white disabled:opacity-50"
          >
            {schedulePending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Kaydet
          </button>
          <p className="text-[12px] text-[#64748b]">
            {decision.due
              ? "Şu an tetiklenmeye hazır."
              : `Şu an atlanır: ${"reason" in decision ? decision.reason : ""}`}
            {schedule.lastScheduledAt
              ? ` · Son otomatik: ${new Date(schedule.lastScheduledAt).toLocaleString("tr-TR")}`
              : " · Henüz otomatik çalışmadı"}
          </p>
        </div>
        {scheduleNotice ? <p className="mt-2 text-[12px] font-semibold text-[#059669]">{scheduleNotice}</p> : null}
        {scheduleError ? <p className="mt-2 text-[12px] font-semibold text-[#dc2626]">{scheduleError}</p> : null}
      </section>

      {/* JOB KARTLARI */}
      <section>
        <h2 className="mb-3 text-[14px] font-extrabold tracking-wide text-[#1e293b] uppercase">
          Senkronizasyon İşlemleri
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {JOBS.map((job) => {
            const Icon = job.icon;
            return (
              <button
                key={job.action}
                type="button"
                disabled={running || hasRunning}
                onClick={() => startJob(job.action)}
                className={`group flex flex-col rounded-xl border border-[#e8edf3] bg-white p-4 text-left shadow-sm transition hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${job.color}`}>
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-extrabold text-[#0f172a]">{job.label}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-[#6b7280]">{job.description}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-[#2f6bff] opacity-0 transition group-hover:opacity-100">
                  <Play className="size-3" />
                  Başlat
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* TEKİL ÜRÜN ÇEKME */}
      <section className="rounded-xl border border-[#e8edf3] bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-extrabold tracking-wide text-[#1e293b] uppercase">
          Tekil Ürün Çekme
        </h2>
        <p className="mb-3 text-[12px] text-[#6b7280]">
          Etkin&apos;deki ürün ID&apos;sini girerek tek bir ürünü varyantlarıyla ve görselleriyle çekebilirsiniz.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full min-w-0 flex-1 sm:max-w-[300px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="number"
              min={1}
              value={singleId}
              onChange={(e) => setSingleId(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void fetchSingle(); }}
              placeholder="Ürün ID (ör: 12345)"
              className="h-10 w-full rounded-lg border border-[#dbe3ee] bg-[#f8fafc] pl-10 pr-3 text-[13px] outline-none placeholder:text-[#94a3b8]"
            />
          </div>
          <button
            type="button"
            disabled={singleLoading || !singleId.trim() || hasRunning}
            onClick={() => void fetchSingle()}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0f172a] px-4 text-[12px] font-bold text-white disabled:opacity-50 sm:w-auto"
          >
            {singleLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Çek
          </button>
        </div>
        {singleResult ? (
          <p className={`mt-2 text-[12px] font-semibold ${singleResult.ok ? "text-[#059669]" : "text-[#dc2626]"}`}>
            {singleResult.ok ? "Ürün başarıyla çekildi." : singleResult.error}
          </p>
        ) : null}
      </section>

      {/* DURUM MESAJI */}
      {result ? (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${result.ok ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#fecaca] bg-[#fef2f2]"}`}>
          {result.ok ? <CheckCircle2 className="mt-0.5 size-5 text-[#16a34a]" /> : <AlertCircle className="mt-0.5 size-5 text-[#dc2626]" />}
          <div>
            <p className="text-[13px] font-bold text-[#0f172a]">
              {result.ok ? "Senkronizasyon tamamlandı" : "Hata oluştu"}
            </p>
            {result.error ? <p className="mt-1 text-[12px] text-[#dc2626]">{result.error}</p> : null}
          </div>
          <button type="button" onClick={() => setResult(null)} className="ml-auto">
            <X className="size-4 text-[#94a3b8]" />
          </button>
        </div>
      ) : null}

      {(running || hasRunning) ? (
        <div className="flex items-center gap-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4">
          <Loader2 className="size-5 animate-spin text-[#d97706]" />
          <div>
            <p className="text-[13px] font-bold text-[#92400e]">Senkronizasyon çalışıyor…</p>
            <p className="text-[11px] text-[#92400e]/70">Sayfa otomatik yenilenecek.</p>
          </div>
        </div>
      ) : null}

      {/* GEÇMİŞ */}
      <section className="rounded-xl border border-[#e8edf3] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#eef2f7] px-5 py-3">
          <h2 className="text-[13px] font-extrabold tracking-wide text-[#1e293b] uppercase">
            Senkronizasyon Geçmişi
          </h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#2f6bff]"
          >
            <RefreshCw className="size-3.5" />
            Yenile
          </button>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[900px] text-left text-[13px]">
            <thead className="border-b border-[#eef2f7] bg-[#fafbfc] text-[11px] font-bold tracking-wide text-[#94a3b8] uppercase">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-3 py-3">İşlem Türü</th>
                <th className="px-3 py-3">Durum</th>
                <th className="px-3 py-3">Başlangıç</th>
                <th className="px-3 py-3">Süre</th>
                <th className="px-3 py-3">İstek</th>
                <th className="px-3 py-3">Kategori</th>
                <th className="px-3 py-3">Ürün</th>
                <th className="px-3 py-3">Görsel</th>
                <th className="px-3 py-3">Hata</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#94a3b8]">
                    Henüz senkronizasyon kaydı yok.
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="border-b border-[#f1f5f9] last:border-0">
                    <td className="px-4 py-3 font-bold text-[#334155]">#{run.id}</td>
                    <td className="px-3 py-3">
                      <JobTypeBadge type={run.errorMessage && !run.errorMessage.includes(" ") ? run.errorMessage : "sync"} />
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#64748b]">{fmtDate(run.startedAt)}</td>
                    <td className="px-3 py-3 text-[12px] text-[#64748b]">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {elapsed(run.startedAt, run.finishedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold">{run.requestCount}</td>
                    <td className="px-3 py-3 font-semibold">
                      {run.categoriesUpsert > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <FolderTree className="size-3 text-[#8b5cf6]" />
                          {run.categoriesUpsert}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      {run.productsUpserted > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Package className="size-3 text-[#059669]" />
                          {run.productsUpserted}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      {run.imagesDownloaded > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="size-3 text-[#2f6bff]" />
                          {run.imagesDownloaded}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-3 text-[12px] text-[#dc2626]">
                      {run.status === "failed" && run.errorMessage ? (
                        <details className="max-w-[300px]">
                          <summary className="cursor-pointer truncate">{run.errorMessage}</summary>
                          <p className="mt-1 whitespace-pre-wrap break-all rounded bg-[#fef2f2] p-2 text-[11px]">
                            {run.errorMessage}
                          </p>
                        </details>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function JobTypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    full: { label: "Tam", color: "bg-[#e8f0ff] text-[#2563eb]" },
    categories: { label: "Kategori", color: "bg-[#f3e8ff] text-[#7c3aed]" },
    products: { label: "Ürünler", color: "bg-[#d1fae5] text-[#059669]" },
    single_product: { label: "Tekil", color: "bg-[#fef3c7] text-[#d97706]" },
    stock_prices: { label: "Stok/Fiyat", color: "bg-[#ffedd5] text-[#ea580c]" },
    sync: { label: "Senkron", color: "bg-[#f1f5f9] text-[#475569]" },
  };
  const s = map[type] ?? map.sync!;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${s.color}`}>
      {s.label}
    </span>
  );
}
