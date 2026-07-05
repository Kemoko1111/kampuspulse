-- Reviews could be created (from the orders page) but nothing aggregated them,
-- so products.rating / products.total_reviews / profiles.rating stayed 0
-- forever. This trigger recomputes those whenever a review changes.

CREATE OR REPLACE FUNCTION public.recompute_review_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_product uuid := COALESCE(NEW.reference_id, OLD.reference_id);
  target_profile uuid := COALESCE(NEW.reviewed_id, OLD.reviewed_id);
  target_type text := COALESCE(NEW.type, OLD.type);
BEGIN
  -- Product star rating + count (product-type, non-hidden reviews only).
  IF target_type = 'product' AND target_product IS NOT NULL THEN
    UPDATE public.products p SET
      rating = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r
        WHERE r.type = 'product' AND r.reference_id = target_product AND r.is_hidden = false
      ), 0),
      total_reviews = (
        SELECT COUNT(*) FROM public.reviews r
        WHERE r.type = 'product' AND r.reference_id = target_product AND r.is_hidden = false
      )
    WHERE p.id = target_product;
  END IF;

  -- The reviewed person's overall rating (sellers, riders, task workers).
  IF target_profile IS NOT NULL THEN
    UPDATE public.profiles pr SET
      rating = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r
        WHERE r.reviewed_id = target_profile AND r.is_hidden = false
      ), 0)
    WHERE pr.id = target_profile;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS reviews_aggregate_trigger ON public.reviews;
CREATE TRIGGER reviews_aggregate_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_review_aggregates();

-- Backfill existing data.
UPDATE public.products p SET
  rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.type='product' AND r.reference_id = p.id AND r.is_hidden = false), 0),
  total_reviews = (SELECT COUNT(*) FROM public.reviews r WHERE r.type='product' AND r.reference_id = p.id AND r.is_hidden = false);

UPDATE public.profiles pr SET
  rating = COALESCE((SELECT ROUND(AVG(r.rating)::numeric, 2) FROM public.reviews r WHERE r.reviewed_id = pr.id AND r.is_hidden = false), 0)
WHERE EXISTS (SELECT 1 FROM public.reviews r WHERE r.reviewed_id = pr.id);
