CREATE TABLE public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  sort integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sponsors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsors TO authenticated;
GRANT ALL ON public.sponsors TO service_role;

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsors_public_read" ON public.sponsors FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "sponsors_admin_read" ON public.sponsors FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "sponsors_admin_write" ON public.sponsors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_sponsors_updated BEFORE UPDATE ON public.sponsors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.sponsors (name, logo_url, link, sort) VALUES
  ('دیانا ابر', '', 'https://diarad.2bd.net', 1);