"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { ColumnCategory } from "@/lib/utils/columnCategories";

export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  sortComparator?: (a: T, b: T) => number;
  category?: ColumnCategory;
  priority?: number;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
}

type SortDirection = "asc" | "desc" | null;

export function Table<T = any>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  className,
  onRowClick,
  striped = false,
  hoverable = true,
  bordered = true,
  compact = false,
}: TableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

  // Handle column sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortKey === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(columnKey);
      setSortDirection("asc");
    }
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    const column = columns.find((col) => col.key === sortKey);
    if (!column) return data;

    // Find Passenger_injury column for secondary sorting
    const passengerInjuryColumn = columns.find((col) => col.key === "Passenger_injury");

    return [...data].sort((a, b) => {
      let primaryResult = 0;

      // Use custom sort comparator if provided
      if (column.sortComparator) {
        primaryResult = column.sortComparator(a, b);
        primaryResult = sortDirection === "asc" ? primaryResult : -primaryResult;
      } else {
        let aValue: any;
        let bValue: any;

        if (column.accessor) {
          aValue = column.accessor(a);
          bValue = column.accessor(b);
        } else {
          aValue = (a as any)[sortKey];
          bValue = (b as any)[sortKey];
        }

        // Handle different types
        if (typeof aValue === "string" && typeof bValue === "string") {
          primaryResult = sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          primaryResult = sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        } else {
          // Default string comparison
          const aStr = String(aValue || "");
          const bStr = String(bValue || "");
          primaryResult = sortDirection === "asc"
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr);
        }
      }

      // If primary sort is equal (0), use Passenger_injury as secondary sort (if not already sorting by it)
      if (primaryResult === 0 && sortKey !== "Passenger_injury" && passengerInjuryColumn?.sortComparator) {
        return passengerInjuryColumn.sortComparator(a, b);
      }

      return primaryResult;
    });
  }, [data, sortKey, sortDirection, columns]);

  // Get cell content
  const getCellContent = (row: T, column: TableColumn<T>) => {
    if (column.accessor) {
      return column.accessor(row);
    }
    return (row as any)[column.key] ?? "-";
  };

  // Truncate text and show tooltip on hover
  const TruncatedCell = ({ content }: { content: React.ReactNode }) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    const cellRef = React.useRef<HTMLDivElement>(null);

    // Check if content is React element (like badges, buttons)
    if (React.isValidElement(content)) {
      return <>{content}</>;
    }

    const textContent = String(content || "-");
    
    // Don't truncate very short text
    if (textContent.length <= 50) {
      return <span>{textContent}</span>;
    }

    return (
      <div
        ref={cellRef}
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="truncate max-w-full cursor-help" title={textContent}>
          {textContent}
        </div>
        {showTooltip && (
          <div className="absolute z-50 bg-slate-900 text-white text-xs rounded-lg shadow-xl px-3 py-2 max-w-md whitespace-normal break-words left-0 top-full mt-1 pointer-events-none">
            {textContent}
            <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 transform rotate-45"></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <table
      className={cn(
        "w-full border-collapse bg-white text-sm",
        className
      )}
    >
      <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key}
                onClick={() => column.sortable && handleSort(column.key)}
                className={cn(
                  "px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap",
                  index !== columns.length - 1 && "border-r border-gray-200",
                  column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors select-none",
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right"
                )}
                style={{ width: column.width, minWidth: column.width }}
              >
                <div className="flex items-center gap-2 justify-start">
                  <span className="truncate">{column.header}</span>
                  {column.sortable && (
                    <span className="flex-shrink-0 text-gray-400 ml-1">
                      {sortKey === column.key ? (
                        sortDirection === "asc" ? (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M5 10l5-5 5 5H5z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M15 10l-5 5-5-5h10z" />
                          </svg>
                        )
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5 8l5-5 5 5H5zm0 4l5 5 5-5h-10z" />
                        </svg>
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center border-b border-gray-200"
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-gray-600 font-medium">Loading data...</span>
                </div>
              </td>
            </tr>
          ) : sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center border-b border-gray-200"
              >
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-gray-500 font-medium">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-gray-200 transition-colors",
                  striped && rowIndex % 2 === 0 && "bg-white",
                  striped && rowIndex % 2 === 1 && "bg-gray-50",
                  hoverable && "hover:bg-blue-50 transition-all duration-100",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-6 py-4 text-sm text-gray-700",
                      colIndex !== columns.length - 1 && "border-r border-gray-200",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right"
                    )}
                    style={{ width: column.width, minWidth: column.width }}
                  >
                    <TruncatedCell content={getCellContent(row, column)} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
  );
}

Table.displayName = "Table";
