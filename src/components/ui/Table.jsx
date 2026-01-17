import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";

function Table({ columns = [], data = [], emptyLabel = "No data", onRowClick }) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const sorted = useMemo(() => {
    if (!sort.key) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return data;
    return [...data].sort((a, b) => {
      const aVal = col.sortValue ? col.sortValue(a) : a[sort.key];
      const bVal = col.sortValue ? col.sortValue(b) : b[sort.key];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      return sort.dir === "asc" ? (aVal > bVal ? 1 : -1) : (aVal > bVal ? -1 : 1);
    });
  }, [data, sort, columns]);

  const handleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: "asc" };
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600",
                  col.align === "right" && "text-right"
                )}
              >
                <button
                  type="button"
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={clsx(
                    "flex items-center gap-1",
                    col.align === "right" && "justify-end",
                    !col.sortable && "cursor-default"
                  )}
                >
                  {col.header}
                  {col.sortable && sort.key === col.key && (
                    sort.dir === "asc" ? (
                      <ChevronUp className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    )
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {sorted.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-slate-500"
              >
                {emptyLabel}
              </td>
            </tr>
          )}
          {sorted.map((row) => (
            <tr
              key={row.id || row.recordId || row.requestId}
              className={clsx(onRowClick && "cursor-pointer hover:bg-slate-50")}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={clsx(
                    "px-4 py-3",
                    col.align === "right" && "text-right"
                  )}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
