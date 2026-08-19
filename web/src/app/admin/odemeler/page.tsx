import { PaymentsPageView, type PaymentKpi, type PaymentMethodRow } from "@/components/admin/PaymentsPageView";
import { BankAccountsPanel } from "@/components/admin/BankAccountsPanel";
import { getTurkeyBank } from "@/data/turkey-banks";
import { ensurePaymentMethods, getIyzicoConfig, iyzicoConfigReady, isCheckoutMethodKey, PAYMENT_KIND_LABEL, PAYMENT_PROVIDER_LABEL } from "@/lib/commerce/payments";
import { prisma } from "@/lib/db";
import { formatPriceTry } from "@/lib/media";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ödeme Yöntemleri | Yönetim" };

function pct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export default async function AdminPaymentsPage() {
  await ensurePaymentMethods();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [methods, banks, monthCount, prevCount, monthSum, prevSum, iyzico] = await Promise.all([
    prisma.paymentMethod.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.transferBank.findMany({ orderBy: { id: "asc" } }),
    prisma.payment.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.payment.count({ where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "success", createdAt: { gte: monthStart } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "success", createdAt: { gte: prevMonthStart, lt: monthStart } } }),
    getIyzicoConfig(),
  ]);

  const rows: PaymentMethodRow[] = methods.map((row) => ({
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    kind: row.kind,
    kindLabel: PAYMENT_KIND_LABEL[row.kind],
    provider: row.provider,
    providerLabel: PAYMENT_PROVIDER_LABEL[row.provider] || row.provider || "—",
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    checkoutEnabled: isCheckoutMethodKey(row.key),
  }));

  const active = rows.filter((row) => row.isActive).length;
  const monthAmount = Number(monthSum._sum.amount ?? 0);

  const kpis: PaymentKpi[] = [
    { label: "Toplam Yöntem", value: rows.length.toLocaleString("tr-TR"), color: "bg-[#2f6bff]", icon: "total" },
    { label: "Aktif Yöntem", value: active.toLocaleString("tr-TR"), color: "bg-[#22c55e]", icon: "active" },
    { label: "Pasif Yöntem", value: (rows.length - active).toLocaleString("tr-TR"), color: "bg-[#f59e0b]", icon: "passive" },
    { label: "Toplam İşlem", value: monthCount.toLocaleString("tr-TR"), delta: pct(monthCount, prevCount), color: "bg-[#7c3aed]", icon: "tx" },
    { label: "Toplam Tutar", value: `₺${formatPriceTry(monthAmount)}`, delta: pct(monthAmount, Number(prevSum._sum.amount ?? 0)), color: "bg-[#ec4899]", icon: "amount" },
  ];

  const saved = banks
    .map((row) => {
      const meta = getTurkeyBank(row.id);
      if (!meta) return null;
      return {
        id: row.id,
        displayName: row.displayName.trim() || meta.short,
        holderName: row.holderName,
        iban: row.iban,
        accountType: row.accountType,
        enabled: row.enabled,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  return (
    <PaymentsPageView
      methods={rows}
      kpis={kpis}
      monthCount={monthCount}
      monthAmount={monthAmount}
      iyzicoReady={iyzicoConfigReady(iyzico)}
      iyzicoUri={iyzico.uri || "https://sandbox-api.iyzipay.com"}
      banksPanel={<BankAccountsPanel saved={saved} />}
    />
  );
}
