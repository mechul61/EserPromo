"use client";

import type { ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTr } from "@/lib/account";
import { formatDateTimeTr } from "@/lib/auth/login-meta";
import { formatPriceTry } from "@/lib/media";

export function moneyValue(value: unknown) {
  if (value == null || value === "") return "—";
  return `₺${formatPriceTry(Number(value))}`;
}

export function moneyFormatter(params: ValueFormatterParams) {
  return moneyValue(params.value);
}

export function dateFormatter(params: ValueFormatterParams) {
  return formatDateTr(params.value);
}

export function dateTimeFormatter(params: ValueFormatterParams) {
  return params.value ? formatDateTimeTr(params.value) : "—";
}

export function StatusCell(params: ICellRendererParams<{ status?: string }, string>) {
  if (!params.value) return "—";
  return <StatusBadge status={params.value} />;
}

export function PaymentStatusCell(params: ICellRendererParams<{ paymentStatus?: string }, string>) {
  if (!params.value) return "—";
  return <StatusBadge status={params.value} kind="payment" />;
}

export function dateFilterComparator(filterDate: Date, cellValue: string | Date | null) {
  if (!cellValue) return -1;
  const cell = new Date(cellValue);
  const a = Date.UTC(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
  const b = Date.UTC(cell.getFullYear(), cell.getMonth(), cell.getDate());
  if (b < a) return -1;
  if (b > a) return 1;
  return 0;
}
