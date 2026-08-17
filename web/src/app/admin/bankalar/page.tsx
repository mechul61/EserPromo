import { AdminHeading } from "@/components/admin/AdminChrome";
import { BankAccountsPanel } from "@/components/admin/BankAccountsPanel";
import { getTurkeyBank } from "@/data/turkey-banks";
import { prisma } from "@/lib/db";

export const metadata = { title: "Bankalar | Yönetim" };

export default async function AdminBanksPage() {
  const rows = await prisma.transferBank.findMany({ orderBy: { id: "asc" } });
  const saved = rows
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
    <div>
      <AdminHeading
        title="Bankalar"
        subtitle="Banka adını yazın, listeden seçin; IBAN ve alıcı adını kaydedin. Müşteri yalnızca bu hesabı görür."
      />
      <BankAccountsPanel saved={saved} />
    </div>
  );
}
