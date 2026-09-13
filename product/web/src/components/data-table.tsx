"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  className?: string;
  render: (row: T) => React.ReactNode;
  /** Omit for a column that can't be meaningfully sorted (e.g. an actions column). */
  sortValue?: (row: T) => string | number;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowKey: (row: T) => string;
  searchPlaceholder?: string;
  /** Concatenated searchable text for a row — omit to disable the search box entirely. */
  searchText?: (row: T) => string;
  pageSize?: number;
  emptyMessage?: string;
}

// The shared list-page primitive (Phase 11 Phase E) — search, sortable
// columns, and pagination, built once here and reused everywhere a table
// of rows shows up. Client-side sort/filter/paginate on an already-fetched
// array: correct for the small-to-medium admin datasets (campuses,
// classes, a single campus's teachers) this is meant for. A dataset that
// can genuinely grow into the thousands (Students institute-wide) needs
// server-side pagination instead — the same pattern the Students page's
// dedicated /search endpoint already proves — not this component as-is.
export function DataTable<T>({
  columns,
  data,
  getRowKey,
  searchPlaceholder = "Search...",
  searchText,
  pageSize = 8,
  emptyMessage = "No results.",
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!searchText || !query.trim()) return data;
    const q = query.trim().toLowerCase();
    return data.filter((row) => searchText(row).toLowerCase().includes(q));
  }, [data, query, searchText]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return filtered;
    const withValues = filtered.map((row) => ({ row, value: column.sortValue!(row) }));
    withValues.sort((a, b) => {
      if (a.value < b.value) return sort.direction === "asc" ? -1 : 1;
      if (a.value > b.value) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return withValues.map((w) => w.row);
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  function toggleSort(key: string) {
    setPage(0);
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {searchText ? (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setPage(0);
              setQuery(e.target.value);
            }}
            placeholder={searchPlaceholder}
            className="pl-8"
          />
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={cn(column.align === "right" && "text-right", column.className)}>
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-foreground",
                        column.align === "right" && "flex-row-reverse"
                      )}
                    >
                      {column.header}
                      {sort?.key === column.key ? (
                        sort.direction === "asc" ? (
                          <ArrowUp className="size-3.5" />
                        ) : (
                          <ArrowDown className="size-3.5" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3.5 text-muted-foreground/50" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => (
                <TableRow key={getRowKey(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={cn(column.align === "right" && "text-right", column.className)}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sorted.length > 0 ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {currentPage * pageSize + 1}–{Math.min(sorted.length, (currentPage + 1) * pageSize)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
