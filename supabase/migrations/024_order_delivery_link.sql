-- Connect EDWOM orders to the rider delivery system. When an order is paid,
-- a delivery is created (seller -> buyer) and a rider is dispatched; this
-- column links that delivery back to its order so the order-tracking page can
-- show the assigned rider and so the delivery's progress can be mirrored onto
-- the order's status. Nullable: standalone "send a package" deliveries have no
-- order.
ALTER TABLE public.deliveries ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id);
CREATE INDEX IF NOT EXISTS deliveries_order_id_idx ON public.deliveries(order_id);
