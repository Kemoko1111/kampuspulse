-- product.repository.ts and task.repository.ts search with a leading-wildcard
-- ilike ('%term%'), which can't use a standard btree index. products already
-- has a GIN index (products_search_idx), but it's built on to_tsvector(...) —
-- that only accelerates full-text `@@` queries, not ilike, so it does nothing
-- for the actual search queries the app runs. pg_trgm is installed
-- (migration 001) but no gin_trgm_ops index has ever been created — this is
-- the specific index type that DOES accelerate ilike '%...%' substring
-- matching. Fine at current data volumes; this is what keeps it fine as
-- products/tasks grow into the tens of thousands of rows.
CREATE INDEX products_title_trgm_idx ON public.products USING gin (title gin_trgm_ops);
CREATE INDEX products_description_trgm_idx ON public.products USING gin (description gin_trgm_ops);
CREATE INDEX tasks_title_trgm_idx ON public.tasks USING gin (title gin_trgm_ops);
CREATE INDEX tasks_description_trgm_idx ON public.tasks USING gin (description gin_trgm_ops);
