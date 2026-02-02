-- Add core Cyberellum admin emails to VIP list
INSERT INTO public.vip_emails (email, role) VALUES
  ('ceo@cyberellum.technology', 'admin'),
  ('coo@cyberellum.technology', 'admin'),
  ('cto@cyberellum.technology', 'admin')
ON CONFLICT (email) DO NOTHING;