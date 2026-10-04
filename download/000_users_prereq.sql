-- ============================================================
-- PRE-REQUISITO de 001: tabla public.users (auth custom)
-- Reconstruida según la descripción en el encabezado de 001.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id                       SERIAL PRIMARY KEY,
  full_name                TEXT,
  email                    TEXT UNIQUE NOT NULL,
  password_hash            TEXT,
  role                     TEXT,
  province                 TEXT,
  security_certifications  TEXT,
  is_active                BOOLEAN DEFAULT true,
  created_at               TIMESTAMPTZ DEFAULT now(),
  profile_photo_url        TEXT
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
