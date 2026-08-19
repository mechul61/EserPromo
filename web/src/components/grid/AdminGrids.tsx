"use client";

import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AppGrid } from "@/components/grid/AppGrid";
import {
  dateFilterComparator,
  dateFormatter,
  dateTimeFormatter,
  moneyFormatter,
  PaymentStatusCell,
  StatusCell,
} from "@/components/grid/cells";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export type CustomerGridRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  status: string;
  orderCount: number;
  createdAt: string;
};

function CustomerNameCell(params: ICellRendererParams<CustomerGridRow, string>) {
  const row = params.data;
  if (!row) return params.value;
  return (
    <span className="font-extrabold text-navy">
      {row.name}
      {!row.isActive ? <span className="ml-2 text-[11px] font-bold text-brand-red">Pasif</span> : null}
    </span>
  );
}

const customerCols: ColDef<CustomerGridRow>[] = [
  { field: "name", headerName: "AD", flex: 1.2, minWidth: 160, cellRenderer: CustomerNameCell },
  { field: "email", headerName: "E-POSTA", flex: 1.3, minWidth: 180 },
  { field: "phone", headerName: "TELEFON", flex: 1, minWidth: 140 },
  { field: "role", headerName: "ROL", width: 120 },
  { field: "status", headerName: "DURUM", width: 110, filter: true },
  { field: "orderCount", headerName: "SİPARİŞ", width: 110, filter: "agNumberColumnFilter" },
  {
    field: "createdAt",
    headerName: "KAYIT",
    width: 130,
    filter: "agDateColumnFilter",
    filterParams: { comparator: dateFilterComparator },
    valueFormatter: dateFormatter,
  },
];

export function CustomersGrid({ rows }: { rows: CustomerGridRow[] }) {
  return (
    <AppGrid
      rowData={rows}
      columnDefs={customerCols}
      emptyText="Müşteri bulunamadı."
      hrefForRow={(row) => `/admin/musteriler/${row.id}`}
      getRowId={(row) => row.id}
    />
  );
}

export type OrderGridRow = {
  id: string;
  publicNumber: string;
  customer: string;
  email: string;
  status: string;
  products: string;
  total: number;
  createdAt: string;
};

function OrderCustomerCell(params: ICellRendererParams<OrderGridRow>) {
  const row = params.data;
  if (!row) return null;
  return (
    <div>
      <p className="font-semibold">{row.customer}</p>
      <p className="text-[12px] text-[#6b7280]">{row.email}</p>
    </div>
  );
}

const orderCols: ColDef<OrderGridRow>[] = [
  { field: "publicNumber", headerName: "NO", width: 140, cellClass: "font-extrabold text-navy" },
  { field: "customer", headerName: "MÜŞTERİ", flex: 1.2, minWidth: 180, cellRenderer: OrderCustomerCell },
  { field: "status", headerName: "DURUM", width: 160, cellRenderer: StatusCell },
  { field: "products", headerName: "ÜRÜN", flex: 1.4, minWidth: 200 },
  { field: "total", headerName: "TUTAR", width: 130, filter: "agNumberColumnFilter", valueFormatter: moneyFormatter },
  {
    field: "createdAt",
    headerName: "TARİH",
    width: 160,
    filter: "agDateColumnFilter",
    filterParams: { comparator: dateFilterComparator },
    valueFormatter: dateTimeFormatter,
  },
];

export function OrdersGrid({ rows }: { rows: OrderGridRow[] }) {
  return (
    <AppGrid
      rowData={rows}
      columnDefs={orderCols}
      searchPlaceholder="Sipariş no, müşteri veya e-posta"
      emptyText="Sipariş bulunamadı."
      hrefForRow={(row) => `/admin/siparisler/${row.publicNumber}`}
      getRowId={(row) => row.id}
    />
  );
}

export type CartGridRow = {
  id: string;
  customer: string;
  email: string;
  products: string;
  quantity: number;
  total: number;
  updatedAt: string;
};

function CartCustomerCell(params: ICellRendererParams<CartGridRow>) {
  const row = params.data;
  if (!row) return null;
  return (
    <div>
      <p className="font-extrabold text-navy">{row.customer}</p>
      {row.email ? <p className="text-[12px] text-[#6b7280]">{row.email}</p> : null}
    </div>
  );
}

const cartCols: ColDef<CartGridRow>[] = [
  { field: "customer", headerName: "MÜŞTERİ", flex: 1.2, minWidth: 180, cellRenderer: CartCustomerCell },
  { field: "products", headerName: "ÜRÜN", flex: 1.4, minWidth: 200 },
  { field: "quantity", headerName: "ADET", width: 100, filter: "agNumberColumnFilter" },
  { field: "total", headerName: "TUTAR", width: 130, filter: "agNumberColumnFilter", valueFormatter: moneyFormatter },
  {
    field: "updatedAt",
    headerName: "GÜNCELLEME",
    width: 160,
    filter: "agDateColumnFilter",
    filterParams: { comparator: dateFilterComparator },
    valueFormatter: dateTimeFormatter,
  },
];

export function CartsGrid({ rows, compact = false }: { rows: CartGridRow[]; compact?: boolean }) {
  return (
    <AppGrid
      rowData={rows}
      columnDefs={cartCols}
      searchPlaceholder={compact ? undefined : "Müşteri, e-posta veya ürün"}
      height={compact ? 360 : 520}
      pageSize={compact ? 10 : 20}
      floatingFilter={!compact}
      emptyText="Dolu sepet yok."
      hrefForRow={(row) => `/admin/sepetler/${row.id}`}
      getRowId={(row) => row.id}
    />
  );
}

export type SyncGridRow = {
  id: string;
  startedAt: string;
  status: string;
  products: number;
  images: number;
  error: string;
};

const syncCols: ColDef<SyncGridRow>[] = [
  {
    field: "startedAt",
    headerName: "BAŞLANGIÇ",
    flex: 1,
    minWidth: 160,
    filter: "agDateColumnFilter",
    filterParams: { comparator: dateFilterComparator },
    valueFormatter: dateTimeFormatter,
  },
  { field: "status", headerName: "DURUM", width: 140 },
  { field: "products", headerName: "ÜRÜN", width: 120, filter: "agNumberColumnFilter" },
  { field: "images", headerName: "GÖRSEL", width: 120, filter: "agNumberColumnFilter" },
  { field: "error", headerName: "HATA", flex: 1.4, minWidth: 200, cellClass: "text-brand-red" },
];

export function SyncGrid({ rows }: { rows: SyncGridRow[] }) {
  return (
    <AppGrid
      rowData={rows}
      columnDefs={syncCols}
      searchPlaceholder="Durum veya hata"
      emptyText="Henüz senkron kaydı yok."
      getRowId={(row) => row.id}
    />
  );
}

export type StatusCountRow = {
  status: string;
  count: number;
  total: number;
};

const statusCountCols: ColDef<StatusCountRow>[] = [
  { field: "status", headerName: "DURUM", flex: 1.4, minWidth: 160, cellRenderer: StatusCell },
  { field: "count", headerName: "ADET", width: 100, filter: "agNumberColumnFilter" },
  { field: "total", headerName: "TUTAR", flex: 1, minWidth: 120, filter: "agNumberColumnFilter", valueFormatter: moneyFormatter },
];

export function StatusCountGrid({ rows }: { rows: StatusCountRow[] }) {
  return (
    <AppGrid
      rowData={rows}
      columnDefs={statusCountCols}
      emptyText="Bu dönemde sipariş yok."
      height={280}
      pageSize={10}
      floatingFilter={false}
      getRowId={(row) => row.status}
    />
  );
}

export type PaymentBreakRow = {
  id: string;
  status: string;
  channel: string;
  count: number;
  total: number;
};

const paymentBreakCols: ColDef<PaymentBreakRow>[] = [
  { field: "status", headerName: "DURUM", flex: 1, minWidth: 140, cellRenderer: PaymentStatusCell },
  { field: "channel", headerName: "KANAL", flex: 1, minWidth: 120 },
  { field: "count", headerName: "ADET", width: 90, filter: "agNumberColumnFilter" },
  { field: "total", headerName: "TUTAR", width: 120, filter: "agNumberColumnFilter", valueFormatter: moneyFormatter },
];

export function PaymentBreakGrid({ rows }: { rows: PaymentBreakRow[] }) {
  return (
    <AppGrid
      rowData={rows}
      columnDefs={paymentBreakCols}
      emptyText="Bu dönemde ödeme kaydı yok."
      height={280}
      pageSize={10}
      floatingFilter={false}
      getRowId={(row) => row.id}
    />
  );
}

const miniOrderCols: ColDef<OrderGridRow>[] = [
  { field: "publicNumber", headerName: "NO", width: 140, cellClass: "font-extrabold text-navy" },
  { field: "customer", headerName: "MÜŞTERİ", flex: 1.2, minWidth: 160, cellRenderer: OrderCustomerCell },
  { field: "status", headerName: "DURUM", width: 150, cellRenderer: StatusCell },
  { field: "total", headerName: "TUTAR", width: 120, filter: "agNumberColumnFilter", valueFormatter: moneyFormatter },
  {
    field: "createdAt",
    headerName: "TARİH",
    width: 150,
    filter: "agDateColumnFilter",
    filterParams: { comparator: dateFilterComparator },
    valueFormatter: dateTimeFormatter,
  },
];

export function MiniOrdersGrid({ rows, emptyText }: { rows: OrderGridRow[]; emptyText: string }) {
  return (
    <AppGrid
      rowData={rows}
      columnDefs={miniOrderCols}
      emptyText={emptyText}
      height={360}
      pageSize={10}
      floatingFilter={false}
      hrefForRow={(row) => `/admin/siparisler/${row.publicNumber}`}
      getRowId={(row) => row.id}
    />
  );
}

export type CartLineGridRow = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  total: number;
};

const cartLineCols: ColDef<CartLineGridRow>[] = [
  { field: "name", headerName: "ÜRÜN", flex: 1.6, minWidth: 180, cellClass: "font-extrabold text-navy" },
  { field: "sku", headerName: "SKU", width: 140 },
  { field: "quantity", headerName: "ADET", width: 100, filter: "agNumberColumnFilter" },
  { field: "total", headerName: "TUTAR", width: 130, filter: "agNumberColumnFilter", valueFormatter: moneyFormatter },
];

export function CartLinesGrid({
  rows,
  onRowClick,
}: {
  rows: CartLineGridRow[];
  onRowClick?: (row: CartLineGridRow) => void;
}) {
  return (
    <AppGrid
      rowData={rows}
      columnDefs={cartLineCols}
      emptyText="Sepet boş."
      height={Math.min(420, 120 + rows.length * 46)}
      pagination={rows.length > 12}
      floatingFilter={false}
      onRowClick={onRowClick}
      getRowId={(row) => row.id}
    />
  );
}

export type RevenueOrderRow = {
  id: string;
  publicNumber: string;
  userId: string;
  createdAt: string;
  paidAt: string | null;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  subtotal: number;
  vatTotal: number;
  customer: string;
  email: string;
  phone: string;
  payment: string;
};

function RevenueCustomerCell(params: ICellRendererParams<RevenueOrderRow>) {
  const row = params.data;
  if (!row) return null;
  return (
    <div>
      <p className="font-semibold">{row.customer}</p>
      <p className="text-[12px] text-[#6b7280]">{row.email}</p>
      {row.phone ? <p className="text-[12px] text-[#6b7280]">{row.phone}</p> : null}
    </div>
  );
}

function RevenueStatusFormCell(params: ICellRendererParams<RevenueOrderRow>) {
  const row = params.data;
  if (!row) return null;
  return <OrderStatusForm compact orderId={row.id} status={row.status} paymentStatus={row.paymentStatus} />;
}

export function RevenueOrdersGrid({
  rows,
  emptyText = "Kayıt yok.",
}: {
  rows: RevenueOrderRow[];
  emptyText?: string;
}) {
  const cols: ColDef<RevenueOrderRow>[] = [
    { field: "publicNumber", headerName: "NO", width: 140, cellClass: "font-extrabold text-navy" },
    { field: "customer", headerName: "MÜŞTERİ", flex: 1.4, minWidth: 180, cellRenderer: RevenueCustomerCell },
    { field: "payment", headerName: "KANAL", width: 130 },
    {
      field: "grandTotal",
      headerName: "TUTAR",
      width: 130,
      filter: "agNumberColumnFilter",
      valueFormatter: moneyFormatter,
    },
    {
      field: "createdAt",
      headerName: "TARİH",
      width: 150,
      filter: "agDateColumnFilter",
      filterParams: { comparator: dateFilterComparator },
      valueFormatter: dateTimeFormatter,
    },
    {
      headerName: "ÖDEME",
      minWidth: 220,
      flex: 1,
      sortable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: RevenueStatusFormCell,
    },
  ];

  return (
    <AppGrid
      rowData={rows}
      columnDefs={cols}
      searchPlaceholder="Sipariş no, müşteri, e-posta"
      emptyText={emptyText}
      height={480}
      hrefForRow={(row) => `/admin/siparisler/${row.publicNumber}`}
      getRowId={(row) => row.id}
    />
  );
}
