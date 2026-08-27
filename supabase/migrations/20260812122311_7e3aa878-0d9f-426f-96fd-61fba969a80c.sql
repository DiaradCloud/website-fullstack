
-- ===== enums =====
CREATE TYPE public.app_role AS ENUM ('admin','support','user');
CREATE TYPE public.service_status AS ENUM ('pending','active','suspended','expired','cancelled');
CREATE TYPE public.order_kind AS ENUM ('new','renew','upgrade','intl');
CREATE TYPE public.order_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.ticket_dept AS ENUM ('password','technical','payment','abuse');
CREATE TYPE public.ticket_priority AS ENUM ('low','normal','high');
CREATE TYPE public.ticket_status AS ENUM ('open','answered','closed');
CREATE TYPE public.request_status AS ENUM ('pending','approved','rejected','done');

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ===== profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  national_id TEXT,
  phone TEXT,
  birth_date TEXT,
  city TEXT,
  network_name TEXT UNIQUE,
  credit BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== roles =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','support'));
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_staff(auth.uid())) WITH CHECK (auth.uid() = id OR public.is_staff(auth.uid()));
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- ===== datacenters =====
CREATE TABLE public.datacenters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  host_ip TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  coming_soon BOOLEAN NOT NULL DEFAULT false,
  description TEXT NOT NULL DEFAULT '',
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.datacenters TO anon, authenticated;
GRANT ALL ON public.datacenters TO service_role;
ALTER TABLE public.datacenters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dc_public_read" ON public.datacenters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "dc_admin_all" ON public.datacenters FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_dc_updated BEFORE UPDATE ON public.datacenters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== plans =====
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datacenter_id UUID NOT NULL REFERENCES public.datacenters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  ram TEXT NOT NULL,
  cpu TEXT NOT NULL,
  disk TEXT NOT NULL,
  bandwidth_gb INT NOT NULL DEFAULT 100,
  price BIGINT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  lock_note TEXT NOT NULL DEFAULT 'فعلا فروش نمی رود',
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "plans_admin_all" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== addons =====
CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price BIGINT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'upgrade',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.addons TO anon, authenticated;
GRANT ALL ON public.addons TO service_role;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addons_public_read" ON public.addons FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "addons_admin_all" ON public.addons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== services =====
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  datacenter_id UUID REFERENCES public.datacenters(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  os TEXT NOT NULL DEFAULT 'Ubuntu 22.04',
  ip TEXT,
  ssh_username TEXT NOT NULL DEFAULT 'user',
  ssh_port INT NOT NULL DEFAULT 9011,
  status public.service_status NOT NULL DEFAULT 'pending',
  bandwidth_gb INT NOT NULL DEFAULT 100,
  bandwidth_used_gb NUMERIC NOT NULL DEFAULT 0,
  intl_enabled BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NOT NULL DEFAULT '',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_select" ON public.services FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "services_staff_write" ON public.services FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== orders =====
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL DEFAULT to_char(now(),'YYMMDD') || lpad((floor(random()*100000))::text, 5, '0'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.order_kind NOT NULL DEFAULT 'new',
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  datacenter_id UUID REFERENCES public.datacenters(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL DEFAULT '',
  os TEXT NOT NULL DEFAULT 'Ubuntu 22.04',
  duration_months INT NOT NULL DEFAULT 1,
  addons JSONB NOT NULL DEFAULT '[]'::jsonb,
  amount BIGINT NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  ticket_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "orders_staff_write" ON public.orders FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== tickets =====
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL DEFAULT 'T' || to_char(now(),'YYMMDD') || lpad((floor(random()*10000))::text, 4, '0'),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  department public.ticket_dept NOT NULL DEFAULT 'technical',
  priority public.ticket_priority NOT NULL DEFAULT 'normal',
  subject TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets_select" ON public.tickets FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "tickets_insert_own" ON public.tickets FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tickets_staff_write" ON public.tickets FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  is_staff BOOLEAN NOT NULL DEFAULT false,
  body TEXT NOT NULL DEFAULT '',
  attachment_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tm_select" ON public.ticket_messages FOR SELECT TO authenticated USING (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);
CREATE POLICY "tm_insert" ON public.ticket_messages FOR INSERT TO authenticated WITH CHECK (
  public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
);

-- ===== vps password requests =====
CREATE TABLE public.vps_password_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'pending',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.vps_password_requests TO authenticated;
GRANT ALL ON public.vps_password_requests TO service_role;
ALTER TABLE public.vps_password_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vpr_select" ON public.vps_password_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "vpr_insert" ON public.vps_password_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "vpr_staff" ON public.vps_password_requests FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ===== international internet requests =====
CREATE TABLE public.intl_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'pending',
  kyc_note TEXT NOT NULL DEFAULT '',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.intl_requests TO authenticated;
GRANT ALL ON public.intl_requests TO service_role;
ALTER TABLE public.intl_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intl_select" ON public.intl_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "intl_insert" ON public.intl_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "intl_staff" ON public.intl_requests FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_intl_updated BEFORE UPDATE ON public.intl_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== blog =====
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  tag TEXT NOT NULL DEFAULT 'مقاله',
  read_minutes INT NOT NULL DEFAULT 5,
  published BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blog_public_read" ON public.blog_posts FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "blog_staff_read" ON public.blog_posts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "blog_staff_all" ON public.blog_posts FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_blog_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== expenses =====
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  amount BIGINT NOT NULL,
  category TEXT NOT NULL DEFAULT 'عمومی',
  spent_at DATE NOT NULL DEFAULT current_date,
  note TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_admin" ON public.expenses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== notifications =====
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL OR public.is_staff(auth.uid()));
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notif_staff" ON public.notifications FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ===== site settings =====
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_admin_all" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ===== seed =====
INSERT INTO public.datacenters (slug, name, location, host_ip, is_active, coming_soon, description, sort) VALUES
('diana-abr','دیانا ابر','ایران — تهران','194.60.231.49', true, false, 'دیتاسنتر اصلی دیاراد کلود با اینترنت پایدار و منابع اختصاصی.', 1),
('lia-center','لیاسنتر','خارج از کشور', NULL, false, true, 'دیتاسنتر بین‌المللی دیاراد — به زودی.', 2);

INSERT INTO public.plans (datacenter_id, name, ram, cpu, disk, bandwidth_gb, price, sort)
SELECT d.id, v.name, v.ram, v.cpu, v.disk, v.bw, v.price, v.sort
FROM public.datacenters d, (VALUES
  ('برنز','0.5GB','0.5 هسته','5GB',50,40000,1),
  ('نقره','1GB','0.75 هسته','10GB',100,60000,2),
  ('طلا','2GB','1 هسته','20GB',200,80000,3),
  ('الماس','4GB','1.5 هسته','30GB',300,100000,4),
  ('یاقوت','6GB','2 هسته','40GB',400,140000,5),
  ('کهکشان','8GB','2.5 هسته','50GB',500,180000,6)
) AS v(name,ram,cpu,disk,bw,price,sort)
WHERE d.slug = 'diana-abr';

INSERT INTO public.addons (name, price, kind, sort) VALUES
('+۱GB رم', 30000, 'upgrade', 1),
('+۱۰GB SSD', 20000, 'upgrade', 2),
('+۰.۵ هسته CPU', 40000, 'upgrade', 3),
('فعال‌سازی GPU', 150000, 'upgrade', 4),
('اینترنت بین‌الملل', 50000, 'intl', 5);

INSERT INTO public.site_settings (key, value) VALUES
('payment', '{"card_number":"6037697677881945","card_holder":"مهراد طراوتی","note":"پس از واریز، تصویر رسید را در بخش پرداختی تیکت ارسال کنید."}'::jsonb),
('general', '{"domain":"diarad.2bd.net","brand":"Diarad Cloud","hero_image":null,"sales_open":true}'::jsonb),
('rewards', '{"1":0,"2":0,"3":3,"6":7,"12":15}'::jsonb);
