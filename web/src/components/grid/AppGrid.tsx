"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridOptions, RowClickedEvent } from "ag-grid-community";
import { AG_GRID_LOCALE_TR } from "@/components/grid/localeTr";
import { registerAgGrid } from "@/components/grid/register";
import { eserGridTheme } from "@/components/grid/theme";

registerAgGrid();

export function AppGrid<T extends object>({
  rowData,
  columnDefs,
  hrefForRow,
  onRowClick,
  searchPlaceholder,
  emptyText = "Kayıt yok",
  height = 520,
  pageSize = 20,
  pagination = true,
  floatingFilter = true,
  getRowId,
}: {
  rowData: T[];
  columnDefs: ColDef<T>[];
  hrefForRow?: (row: T) => string | undefined;
  onRowClick?: (row: T) => void;
  searchPlaceholder?: string;
  emptyText?: string;
  height?: number;
  pageSize?: number;
  pagination?: boolean;
  floatingFilter?: boolean;
  getRowId?: (row: T) => string;
}) {
  const router = useRouter();
  const [quickFilter, setQuickFilter] = useState("");
  const clickable = Boolean(hrefForRow || onRowClick);

  const defaultColDef = useMemo<ColDef<T>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter,
      minWidth: 90,
    }),
    [floatingFilter],
  );

  const gridOptions = useMemo<GridOptions<T>>(
    () => ({
      animateRows: true,
      suppressCellFocus: true,
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination,
      paginationPageSize: pageSize,
      paginationPageSizeSelector: pagination ? [10, 20, 50, 100] : false,
      overlayNoRowsTemplate: `<span class="text-[13px] text-[#6b7280]">${emptyText}</span>`,
      localeText: AG_GRID_LOCALE_TR as GridOptions["localeText"],
      rowHeight: 46,
      headerHeight: 40,
      floatingFiltersHeight: floatingFilter ? 38 : undefined,
    }),
    [emptyText, floatingFilter, pageSize, pagination],
  );

  function handleRowClicked(event: RowClickedEvent<T>) {
    const target = event.event?.target as HTMLElement | undefined;
    if (target?.closest("a, button, input, select, textarea, label")) return;
    const row = event.data;
    if (!row) return;
    onRowClick?.(row);
    const href = hrefForRow?.(row);
    if (href) router.push(href);
  }

  return (
    <div>
      {searchPlaceholder ? (
        <div className="mb-3">
          <input
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            placeholder={searchPlaceholder}
            autoComplete="off"
            className="h-10 w-full rounded-md border border-line bg-white px-3 text-[13px] outline-none focus:border-navy"
          />
        </div>
      ) : null}
      <div
        className={`overflow-hidden rounded-md border border-line bg-white ${clickable ? "ag-eser-clickable" : ""}`}
        style={{ height }}
      >
        <AgGridReact<T>
          theme={eserGridTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          quickFilterText={quickFilter}
          onRowClicked={handleRowClicked}
          getRowId={getRowId ? (params) => getRowId(params.data) : undefined}
          getRowStyle={clickable ? () => ({ cursor: "pointer" }) : undefined}
        />
      </div>
    </div>
  );
}
