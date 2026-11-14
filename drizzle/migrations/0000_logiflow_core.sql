
CREATE TYPE public.order_status AS ENUM ('pendente','em_conferencia','conferido','coleta_agendada','em_transito','entregue','cancelado');
CREATE TYPE public.pickup_status AS ENUM ('agendada','realizada','cancelada');
CREATE TYPE public.occurrence_type AS ENUM ('atraso','avaria','extravio','endereco_incorreto','destinatario_ausente','divergencia','outro');
CREATE TYPE public.occurrence_status AS ENUM ('aberta','em_analise','resolvida');

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_seq integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE POLICY "Own profile select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND company_id = public.current_company_id());
CREATE POLICY "Own company select" ON public.companies FOR SELECT TO authenticated USING (id = public.current_company_id());
CREATE POLICY "Own company update" ON public.companies FOR UPDATE TO authenticated USING (id = public.current_company_id()) WITH CHECK (id = public.current_company_id());

CREATE TABLE public.pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  carrier text NOT NULL,
  scheduled_date date NOT NULL,
  time_window text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status public.pickup_status NOT NULL DEFAULT 'agendada',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pickups TO authenticated;
GRANT ALL ON public.pickups TO service_role;
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company pickups" ON public.pickups FOR ALL TO authenticated
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  customer_name text NOT NULL,
  customer_phone text NOT NULL DEFAULT '',
  customer_email text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  zip_code text NOT NULL DEFAULT '',
  sales_channel text NOT NULL DEFAULT '',
  total_value numeric(12,2) NOT NULL DEFAULT 0,
  shipping_cost numeric(12,2) NOT NULL DEFAULT 0,
  carrier text NOT NULL DEFAULT '',
  tracking_code text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status public.order_status NOT NULL DEFAULT 'pendente',
  delivery_deadline date,
  pickup_id uuid REFERENCES public.pickups(id) ON DELETE SET NULL,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_company_idx ON public.orders(company_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company orders" ON public.orders FOR ALL TO authenticated
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  sku text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  checked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items(order_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company order items" ON public.order_items FOR ALL TO authenticated
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  type public.occurrence_type NOT NULL DEFAULT 'outro',
  description text NOT NULL DEFAULT '',
  resolution text NOT NULL DEFAULT '',
  status public.occurrence_status NOT NULL DEFAULT 'aberta',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.occurrences TO authenticated;
GRANT ALL ON public.occurrences TO service_role;
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company occurrences" ON public.occurrences FOR ALL TO authenticated
  USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id());

CREATE TABLE public.order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status public.order_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_idx ON public.order_events(order_id, created_at);
GRANT SELECT ON public.order_events TO authenticated;
GRANT ALL ON public.order_events TO service_role;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company order events" ON public.order_events FOR SELECT TO authenticated
  USING (company_id = public.current_company_id());

-- updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER pickups_touch BEFORE UPDATE ON public.pickups FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER occurrences_touch BEFORE UPDATE ON public.occurrences FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- order code + timestamps on status
CREATE OR REPLACE FUNCTION public.orders_before_write()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE next_seq integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.companies SET order_seq = order_seq + 1 WHERE id = NEW.company_id RETURNING order_seq INTO next_seq;
    NEW.code := '#' || lpad(next_seq::text, 4, '0');
  ELSE
    NEW.code := OLD.code;
    NEW.company_id := OLD.company_id;
  END IF;
  IF NEW.status = 'em_transito' AND NEW.shipped_at IS NULL THEN NEW.shipped_at := now(); END IF;
  IF NEW.status = 'entregue' AND NEW.delivered_at IS NULL THEN NEW.delivered_at := now(); END IF;
  IF NEW.status <> 'entregue' THEN NEW.delivered_at := NULL; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_before_write BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.orders_before_write();

CREATE OR REPLACE FUNCTION public.orders_log_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_events(company_id, order_id, status) VALUES (NEW.company_id, NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER orders_log_status AFTER INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.orders_log_status();

CREATE OR REPLACE FUNCTION public.occurrences_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'resolvida' AND NEW.resolved_at IS NULL THEN NEW.resolved_at := now(); END IF;
  IF NEW.status <> 'resolvida' THEN NEW.resolved_at := NULL; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER occurrences_before_write BEFORE INSERT OR UPDATE ON public.occurrences FOR EACH ROW EXECUTE FUNCTION public.occurrences_before_write();

-- signup: create company + profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_company uuid;
BEGIN
  INSERT INTO public.companies(name)
  VALUES (COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'store_name'), ''), 'Minha loja'))
  RETURNING id INTO new_company;
  INSERT INTO public.profiles(id, company_id, full_name)
  VALUES (NEW.id, new_company, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.orders_before_write() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.orders_log_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_company_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_company_id() TO authenticated;
