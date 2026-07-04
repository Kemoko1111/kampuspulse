export interface CsvColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string | number | null | undefined;
}

function escapeCsvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvField(c.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvField(c.value(row))).join(",")
  );
  return [header, ...lines].join("\r\n");
}

export function downloadCsv(filename: string, csvContent: string) {
  // Prepend BOM so Excel correctly detects UTF-8 encoding
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Fetches every page of a paginated admin list endpoint and concatenates the results.
 * Supports both `{ data, count }` (users/payments) and `{ orders, total, totalPages }` (orders) shapes.
 */
export async function fetchAllPages<T>(
  baseUrl: string,
  dataKey: string,
  pageSize = 200
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
    const res = await fetch(`${baseUrl}?${params}`);
    if (!res.ok) break;

    const json = await res.json();
    const items: T[] = json[dataKey] || [];
    results.push(...items);

    const total = json.total ?? json.count ?? 0;
    const totalPages = json.totalPages ?? Math.ceil(total / pageSize) ?? 1;

    if (items.length === 0 || page >= totalPages) break;
    page++;
  }

  return results;
}
