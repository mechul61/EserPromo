import { prisma } from "../db";
import { formatIban, getTurkeyBank, type TurkeyBank } from "@/data/turkey-banks";

export type TransferAccount = {
  id: string;
  name: string;
  holder: string;
  iban: string;
  accountType: string;
};

export { formatIban };

export async function getEnabledTransferBanks(): Promise<TransferAccount[]> {
  const rows = await prisma.transferBank.findMany({
    where: { enabled: true, NOT: { iban: "" } },
    orderBy: { id: "asc" },
  });
  const accounts: TransferAccount[] = [];
  for (const row of rows) {
    const meta = getTurkeyBank(row.id);
    if (!meta) continue;
    if (!row.holderName.trim() || !row.iban.trim()) continue;
    accounts.push({
      id: row.id,
      name: row.displayName.trim() || meta.short,
      holder: row.holderName.trim(),
      iban: row.iban.replace(/\s+/g, "").toUpperCase(),
      accountType: row.accountType.trim() || "Vadesiz TL",
    });
  }
  return accounts;
}

export function isAllowedTransferBank(enabled: TransferAccount[], value: string) {
  const needle = value.trim().toLocaleLowerCase("tr");
  return enabled.some(
    (bank) => bank.id === needle || bank.name.toLocaleLowerCase("tr") === needle,
  );
}

export function findTransferAccount(enabled: TransferAccount[], value: string) {
  const needle = value.trim().toLocaleLowerCase("tr");
  return (
    enabled.find((bank) => bank.id === needle || bank.name.toLocaleLowerCase("tr") === needle) ?? null
  );
}

export type { TurkeyBank };
