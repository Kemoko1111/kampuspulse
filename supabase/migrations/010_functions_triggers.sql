-- 010: Functions and triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_profile_id UUID;
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  RETURNING id INTO new_profile_id;

  INSERT INTO public.wallets (user_id) VALUES (new_profile_id);
  INSERT INTO public.user_presence (profile_id) VALUES (new_profile_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_task_applicant_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.tasks
  SET total_applicants = (
    SELECT COUNT(*) FROM public.task_applications
    WHERE task_id = COALESCE(NEW.task_id, OLD.task_id) AND status = 'pending'
  )
  WHERE id = COALESCE(NEW.task_id, OLD.task_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_wallet_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.wallets
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrement_product_stock(p_product_id UUID, p_quantity INT)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INT;
BEGIN
  SELECT stock_quantity INTO current_stock
  FROM public.products WHERE id = p_product_id FOR UPDATE;

  IF current_stock < p_quantity THEN
    RETURN FALSE;
  END IF;

  UPDATE public.products
  SET stock_quantity = stock_quantity - p_quantity,
      status = CASE WHEN stock_quantity - p_quantity <= 0 THEN 'sold' ELSE status END
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, new_data, actor_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), public.get_profile_id());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, new_data, actor_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), public.get_profile_id());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (table_name, record_id, action, old_data, actor_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), public.get_profile_id());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER on_task_application
  AFTER INSERT OR DELETE ON public.task_applications
  FOR EACH ROW EXECUTE PROCEDURE public.update_task_applicant_count();

CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
CREATE TRIGGER set_cart_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON public.orders FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();
CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();
CREATE TRIGGER audit_rides AFTER INSERT OR UPDATE OR DELETE ON public.rides FOR EACH ROW EXECUTE PROCEDURE public.audit_log_trigger();
