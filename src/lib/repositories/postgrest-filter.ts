// PostgREST's .or()/.and() filter DSL treats commas and parentheses as syntax
// (condition separators / grouping), not literal characters. Interpolating
// raw user input directly into a filter string lets a search term like
// `x",id.neq.<uuid>` inject additional conditions the caller never intended.
// Wrapping the value in double quotes escapes it per PostgREST's filter
// value syntax: https://docs.postgrest.org/en/v13/references/api/tables_views.html#operators
function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Builds a safe `column.ilike."%term%",column2.ilike."%term%"` string for `.or()`. */
export function buildSearchOrFilter(columns: string[], term: string): string {
  const escaped = quoteFilterValue(`%${term}%`);
  return columns.map((column) => `${column}.ilike.${escaped}`).join(",");
}
