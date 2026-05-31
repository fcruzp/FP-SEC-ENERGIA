-- ============================================================
-- MIGRATION: Observatorio Energético + Foro Ciudadano
-- Proyecto: Secretaría de Energía — Fuerza del Pueblo
-- Fecha: Mayo 2026
-- Fase: 1 — Informe Desempeño Empresas Eléctricas Estatales
--
-- PRE-REQUISITO: Existe una tabla public.users con columna id (UUID PK)
-- Todas las FK de usuario referencian public.users(id), NO auth.users(id)
-- ============================================================

-- ============================================================
-- SECCIÓN 1: TABLAS DEL OBSERVATORIO ENERGÉTICO
-- ============================================================

-- 1.1 Entidades del sector eléctrico
CREATE TABLE IF NOT EXISTS entities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN (
    'distribuidora', 'generadora', 'transmisora',
    'comercializadora', 'generadora_privada', 'regulador'
  )),
  parent_id   UUID REFERENCES entities(id) ON DELETE SET NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE entities IS 'Entidades del sector eléctrico dominicano (CDEEE, EDEs, generadoras, etc.)';
COMMENT ON COLUMN entities.type IS 'Tipo de entidad: distribuidora, generadora, transmisora, comercializadora, generadora_privada, regulador';
COMMENT ON COLUMN entities.parent_id IS 'Entidad padre (ej: Edenorte → CDEEE)';

-- 1.2 Categorías de indicadores (mapea a hojas del XLS)
CREATE TABLE IF NOT EXISTS indicator_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT UNIQUE NOT NULL,
  icon         TEXT,
  color        TEXT,
  description  TEXT,
  source_sheet TEXT,           -- hoja del XLS origen ("Variables Relevantes", "EDE''s", etc.)
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE indicator_categories IS 'Categorías de indicadores del observatorio, mapeadas a hojas del XLS';
COMMENT ON COLUMN indicator_categories.source_sheet IS 'Nombre de la hoja en el XLS de donde provienen los indicadores de esta categoría';

-- 1.3 Indicadores
CREATE TABLE IF NOT EXISTS indicators (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id          UUID NOT NULL REFERENCES indicator_categories(id) ON DELETE CASCADE,
  entity_id            UUID REFERENCES entities(id) ON DELETE SET NULL,
  name                 TEXT NOT NULL,
  slug                 TEXT UNIQUE NOT NULL,
  unit                 TEXT NOT NULL,
  description          TEXT,
  source               TEXT DEFAULT 'MEM',
  frequency            TEXT DEFAULT 'monthly' CHECK (frequency IN ('daily','weekly','monthly','quarterly','yearly')),
  chart_type           TEXT DEFAULT 'line' CHECK (chart_type IN ('line','bar','pie','area','gauge','sparkline')),
  is_breakdown         BOOLEAN DEFAULT false,
  parent_indicator_id  UUID REFERENCES indicators(id) ON DELETE SET NULL,
  sort_order           INT DEFAULT 0,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE indicators IS 'Indicadores del observatorio energético (~200+ en Fase 1)';
COMMENT ON COLUMN indicators.is_breakdown IS 'true si es sub-indicador desglosado (ej: Edenorte dentro de EDEs)';
COMMENT ON COLUMN indicators.chart_type IS 'Tipo de gráfico sugerido para visualización';

-- 1.4 Puntos de datos (el corazón del observatorio — mediciones temporales)
CREATE TABLE IF NOT EXISTS data_points (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id    UUID NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
  entity_id       UUID REFERENCES entities(id) ON DELETE SET NULL,
  value           NUMERIC NOT NULL,
  date            DATE NOT NULL,
  period_type     TEXT DEFAULT 'monthly' CHECK (period_type IN ('monthly','quarterly','yearly')),
  source_file     TEXT,
  is_estimated    BOOLEAN DEFAULT false,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),

  -- Un indicador + fecha + entidad = punto único (entity_id null se reemplaza con UUID cero)
  UNIQUE(indicator_id, date, COALESCE(entity_id, '00000000-0000-0000-0000-000000000000'))
);

COMMENT ON TABLE data_points IS 'Mediciones temporales de indicadores. ~41,000+ registros en Fase 1';
COMMENT ON COLUMN data_points.date IS 'Primer día del período (2026-03-01 para marzo 2026)';
COMMENT ON COLUMN data_points.source_file IS 'Nombre del archivo XLS origen (ej: Informe-de-Desempeno-marzo-2026.xlsx)';
COMMENT ON COLUMN data_points.is_estimated IS 'true si el dato es estimado o proyectado, no observado';

-- 1.5 Informes oficiales (metadata de archivos subidos)
CREATE TABLE IF NOT EXISTS reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT,
  file_url        TEXT NOT NULL,
  file_type       TEXT NOT NULL CHECK (file_type IN ('pdf','xls','xlsx','csv')),
  file_size       BIGINT,
  publish_date    DATE,
  source_org      TEXT DEFAULT 'MEM',
  report_type     TEXT DEFAULT 'desempeno_mensual',
  phase           TEXT DEFAULT 'desempeno_eee',
  is_published    BOOLEAN DEFAULT false,
  uploaded_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE reports IS 'Informes oficiales subidos al backoffice (PDF/XLS)';
COMMENT ON COLUMN reports.phase IS 'Fase del observatorio a la que pertenece este informe';
COMMENT ON COLUMN reports.uploaded_by IS 'Usuario (public.users) que subió el archivo';

-- 1.6 Logs de análisis IA
CREATE TABLE IF NOT EXISTS ai_analysis_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id    UUID REFERENCES indicators(id) ON DELETE SET NULL,
  category_id     UUID REFERENCES indicator_categories(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_query      TEXT NOT NULL,
  ai_response     TEXT NOT NULL,
  model_used      TEXT,
  tokens_used     INT,
  cost_usd        NUMERIC,
  created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE ai_analysis_logs IS 'Log de consultas de análisis IA (OpenRouter)';

-- ============================================================
-- SECCIÓN 2: TABLAS DEL FORO CIUDADANO
-- ============================================================

-- 2.1 Perfiles de usuario (extiende public.users)
CREATE TABLE IF NOT EXISTS profiles (
  id                      UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name            TEXT NOT NULL,
  avatar_url              TEXT,
  role                    TEXT DEFAULT 'citizen' CHECK (role IN ('citizen','moderator','admin')),
  is_banned               BOOLEAN DEFAULT false,
  ban_reason              TEXT,
  banned_at               TIMESTAMPTZ,
  banned_by               UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_shadow_banned        BOOLEAN DEFAULT false,
  comment_count           INT DEFAULT 0,
  first_comment_approved  BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Perfiles extendidos de usuarios para el Foro Ciudadano';
COMMENT ON COLUMN profiles.role IS 'Rol del usuario: citizen (default), moderator, admin';
COMMENT ON COLUMN profiles.is_shadow_banned IS 'Shadow ban: el usuario puede comentar pero nadie ve sus comentarios';
COMMENT ON COLUMN profiles.first_comment_approved IS 'Para moderación: primer comentario de usuario nuevo requiere aprobación';

-- 2.2 Posts de la Secretaría
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  content         TEXT NOT NULL,
  excerpt         TEXT,
  cover_image_url TEXT,
  category        TEXT CHECK (category IN ('Propuesta','Informe','Consulta','Evento','Anuncio')),
  is_pinned       BOOLEAN DEFAULT false,
  is_locked       BOOLEAN DEFAULT false,
  is_published    BOOLEAN DEFAULT true,
  comment_count   INT DEFAULT 0,
  reaction_count  INT DEFAULT 0,
  published_at    TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE posts IS 'Posts publicados por la Secretaría en el Foro Ciudadano';

-- 2.3 Comentarios ciudadanos
CREATE TABLE IF NOT EXISTS comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_hidden       BOOLEAN DEFAULT false,
  hidden_by       UUID REFERENCES public.users(id) ON DELETE SET NULL,
  hidden_reason   TEXT,
  is_auto_hidden  BOOLEAN DEFAULT false,
  reaction_count  INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE comments IS 'Comentarios de ciudadanos en los posts del foro';
COMMENT ON COLUMN comments.parent_id IS 'Para respuestas anidadas (máximo 2 niveles: comentario → respuesta)';
COMMENT ON COLUMN comments.is_auto_hidden IS 'Ocultado automáticamente por filtro de palabras prohibidas';

-- 2.4 Reacciones
CREATE TABLE IF NOT EXISTS reactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id       UUID NOT NULL,
  target_type     TEXT NOT NULL CHECK (target_type IN ('post','comment')),
  reaction_type   TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like','agree','disagree','flag')),
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, target_id, target_type)
);

COMMENT ON TABLE reactions IS 'Reacciones de usuarios a posts y comentarios';

-- 2.5 Reportes de abuso
CREATE TABLE IF NOT EXISTS content_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_id       UUID NOT NULL,
  target_type     TEXT NOT NULL CHECK (target_type IN ('post','comment','user')),
  reason          TEXT NOT NULL CHECK (reason IN ('spam','offensive','misinformation','irrelevant','other')),
  description     TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewed','resolved','dismissed')),
  reviewed_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE content_reports IS 'Reportes de abuso hechos por ciudadanos sobre contenido del foro';

-- 2.6 Filtro de palabras prohibidas
CREATE TABLE IF NOT EXISTS banned_words (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word            TEXT UNIQUE NOT NULL,
  is_auto_hide    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE banned_words IS 'Lista de palabras prohibidas configurables por admin. is_auto_hide=true oculta el comentario automáticamente';

-- ============================================================
-- SECCIÓN 3: ÍNDICES
-- ============================================================

-- Observatorio: queries de series temporales
CREATE INDEX IF NOT EXISTS idx_data_points_indicator_date ON data_points(indicator_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_data_points_date ON data_points(date DESC);
CREATE INDEX IF NOT EXISTS idx_data_points_entity ON data_points(entity_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_data_points_source_file ON data_points(source_file);

-- Observatorio: agrupación por categoría y entidad
CREATE INDEX IF NOT EXISTS idx_indicators_category ON indicators(category_id);
CREATE INDEX IF NOT EXISTS idx_indicators_entity ON indicators(entity_id);
CREATE INDEX IF NOT EXISTS idx_indicators_active ON indicators(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_indicators_parent ON indicators(parent_indicator_id) WHERE parent_indicator_id IS NOT NULL;

-- Observatorio: informes por fase y fecha
CREATE INDEX IF NOT EXISTS idx_reports_phase ON reports(phase, report_type, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_reports_published ON reports(is_published, publish_date DESC) WHERE is_published = true;

-- Observatorio: logs IA
CREATE INDEX IF NOT EXISTS idx_ai_logs_indicator ON ai_analysis_logs(indicator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON ai_analysis_logs(user_id, created_at DESC);

-- Foro: posts por categoría y fecha
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned, published_at DESC) WHERE is_pinned = true;

-- Foro: comentarios por post
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_hidden ON comments(is_hidden) WHERE is_hidden = false;

-- Foro: reacciones
CREATE INDEX IF NOT EXISTS idx_reactions_target ON reactions(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON reactions(user_id);

-- Foro: reportes pendientes
CREATE INDEX IF NOT EXISTS idx_reports_pending ON content_reports(status, created_at DESC) WHERE status = 'pending';

-- Foro: perfiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(is_banned) WHERE is_banned = true;

-- Entidades: jerarquía
CREATE INDEX IF NOT EXISTS idx_entities_parent ON entities(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);

-- ============================================================
-- SECCIÓN 4: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- ---- OBSERVATORIO ----

-- entities: lectura pública, escritura solo admins
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entities are viewable by everyone"
  ON entities FOR SELECT USING (true);
CREATE POLICY "Admins can manage entities"
  ON entities FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- indicator_categories: lectura pública, escritura solo admins
ALTER TABLE indicator_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone"
  ON indicator_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories"
  ON indicator_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- indicators: lectura pública, escritura solo admins
ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active indicators are viewable by everyone"
  ON indicators FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage indicators"
  ON indicators FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- data_points: lectura pública, escritura solo admins
ALTER TABLE data_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Data points are viewable by everyone"
  ON data_points FOR SELECT USING (true);
CREATE POLICY "Admins can manage data points"
  ON data_points FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- reports: lectura pública solo publicados, escritura solo admins
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published reports are viewable by everyone"
  ON reports FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can see all reports"
  ON reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
CREATE POLICY "Admins can manage reports"
  ON reports FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- ai_analysis_logs: solo admins pueden leer, usuarios autenticados pueden insertar
ALTER TABLE ai_analysis_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view AI logs"
  ON ai_analysis_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
CREATE POLICY "Authenticated users can create AI logs"
  ON ai_analysis_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view own AI logs"
  ON ai_analysis_logs FOR SELECT USING (
    user_id = auth.uid()
  );

-- ---- FORO ----

-- profiles: cualquiera puede leer, solo el dueño puede editar su perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- posts: cualquiera lee publicados, solo admins crean/editan
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can see all posts"
  ON posts FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
CREATE POLICY "Admins can insert posts"
  ON posts FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
CREATE POLICY "Admins can update posts"
  ON posts FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
CREATE POLICY "Admins can delete posts"
  ON posts FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- comments: no ocultos son visibles; usuarios autenticados no baneados pueden crear
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Non-hidden comments are viewable by everyone"
  ON comments FOR SELECT USING (is_hidden = false);
CREATE POLICY "Admins can see all comments"
  ON comments FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );
CREATE POLICY "Authenticated non-banned users can comment"
  ON comments FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_banned = false AND is_shadow_banned = false)
  );
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins can manage comments"
  ON comments FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- reactions: cualquiera lee, usuarios autenticados crean/borran las propias
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT USING (true);
CREATE POLICY "Users can create own reactions"
  ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reactions"
  ON reactions FOR DELETE USING (auth.uid() = user_id);

-- content_reports: usuarios autenticados crean, admins gestionan
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports"
  ON content_reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can manage all reports"
  ON content_reports FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','moderator'))
  );

-- banned_words: solo admins leen/gestionan
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage banned words"
  ON banned_words FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SECCIÓN 5: TRIGGERS
-- ============================================================

-- 5.1 Auto-crear perfil cuando un usuario se registra en public.users
-- (Si public.users ya tiene registros, los perfiles se crean manualmente o via seed)
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, 'Usuario ' || NEW.id::text),
    'citizen'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nota: Este trigger se adjunta a public.users (NO a auth.users)
-- Si tu flujo de registro inserta en public.users, este trigger
-- crea automáticamente el perfil. Ajusta el nombre de la tabla si es diferente.
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

-- 5.2 Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 5.3 Auto-ocultar comentarios con palabras prohibidas
CREATE OR REPLACE FUNCTION check_banned_words()
RETURNS TRIGGER AS $$
DECLARE
  banned_count INT;
BEGIN
  SELECT COUNT(*) INTO banned_count
  FROM banned_words
  WHERE is_auto_hide = true
    AND LOWER(NEW.content) LIKE '%' || LOWER(word) || '%';

  IF banned_count > 0 THEN
    NEW.is_hidden := true;
    NEW.is_auto_hidden := true;
    NEW.hidden_reason := 'Contiene palabra prohibida (' || banned_count || ' coincidencia(s))';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_comment_banned_words
  BEFORE INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION check_banned_words();

-- 5.4 Actualizar comment_count en posts al insertar comentario
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- 5.5 Actualizar reaction_count en posts/comentarios
CREATE OR REPLACE FUNCTION update_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'post' THEN
      UPDATE posts SET reaction_count = reaction_count + 1 WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'comment' THEN
      UPDATE comments SET reaction_count = reaction_count + 1 WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'post' THEN
      UPDATE posts SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'comment' THEN
      UPDATE comments SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reaction_change
  AFTER INSERT OR DELETE ON reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_reaction_count();

-- 5.6 Actualizar comment_count en perfil
CREATE OR REPLACE FUNCTION update_profile_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET comment_count = comment_count + 1 WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_author_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_comment_count();

-- ============================================================
-- SECCIÓN 6: SEED DATA — ENTIDADES
-- ============================================================

INSERT INTO entities (id, name, slug, type, sort_order) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'CDEEE', 'cdeee', 'comercializadora', 1),
  ('a0000001-0000-0000-0000-000000000002', 'Edenorte', 'edenorte', 'distribuidora', 2),
  ('a0000001-0000-0000-0000-000000000003', 'Edesur', 'edesur', 'distribuidora', 3),
  ('a0000001-0000-0000-0000-000000000004', 'Edeeste', 'edeeste', 'distribuidora', 4),
  ('a0000001-0000-0000-0000-000000000005', 'EGEHID', 'egehid', 'generadora', 5),
  ('a0000001-0000-0000-0000-000000000006', 'ETED', 'eted', 'transmisora', 6),
  ('a0000001-0000-0000-0000-000000000007', 'EGPC / Punta Catalina', 'egpc', 'generadora', 7)
ON CONFLICT (id) DO NOTHING;

-- Sub-entidades: EDEs bajo CDEEE
INSERT INTO entities (name, slug, type, parent_id, sort_order) VALUES
  ('EDEs Consolidado', 'edes-consolidado', 'distribuidora', 'a0000001-0000-0000-0000-000000000001', 10)
ON CONFLICT (slug) DO NOTHING;

-- Generadoras privadas (de la hoja CDEEE)
INSERT INTO entities (name, slug, type, sort_order) VALUES
  ('GSF', 'gsf', 'generadora_privada', 20),
  ('CESPM', 'cespm', 'generadora_privada', 21),
  ('DPP', 'dpp', 'generadora_privada', 22),
  ('EgeHaina (Larimar) II', 'egehaina-larimar', 'generadora_privada', 23),
  ('Electronic JRC (Solar FV 30MWp)', 'electronic-jrc', 'generadora_privada', 24),
  ('Montecristi Solar F.V.', 'montecristi-solar', 'generadora_privada', 25),
  ('C Power DR Operations', 'c-power', 'generadora_privada', 26),
  ('PECASA', 'pecasa', 'generadora_privada', 27),
  ('Matafongo', 'matafongo', 'generadora_privada', 28),
  ('WCG Energy Ltd', 'wcg-energy', 'generadora_privada', 29),
  ('Emerald Solar', 'emerald-solar', 'generadora_privada', 30),
  ('Poseidón', 'poseidon', 'generadora_privada', 31),
  ('Quisqueya II', 'quisqueya-ii', 'generadora_privada', 32),
  ('FALCONDO', 'falcondo', 'generadora_privada', 33),
  ('RSJ', 'rsj', 'generadora_privada', 34),
  ('Mercado Spot', 'mercado-spot', 'generadora_privada', 35)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SECCIÓN 7: SEED DATA — CATEGORÍAS DE INDICADORES
-- ============================================================

INSERT INTO indicator_categories (name, slug, icon, color, description, source_sheet, sort_order) VALUES
  ('Variables Relevantes', 'variables-relevantes', 'TrendingUp', '#3B82F6',
   'Precios de combustibles, generación por tipo de energía, costos marginales del MEM y tasa de cambio',
   'Variables Relevantes', 1),

  ('Empresas Distribuidoras', 'empresas-distribuidoras', 'Building2', '#10B981',
   'Indicadores de gestión de Edenorte, Edesur y Edeeste: compra, venta, facturación, pérdidas, cobranza',
   'EDE''s', 2),

  ('CDEEE', 'cdeee', 'Factory', '#F59E0B',
   'Energía comprada por generadora, facturación, gastos operativos y resultados financieros de la CDEEE',
   'CDEEE', 3),

  ('EGEHID', 'egehid', 'Droplets', '#06B6D4',
   'Generación hidroeléctrica, ventas por mercado (contratos vs spot), ingresos y gastos de EGEHID',
   'EGEHID', 4),

  ('ETED', 'eted', 'Cable', '#8B5CF6',
   'Peajes de transmisión, derechos de uso y conexión, ingresos y gastos de ETED',
   'ETED', 5),

  ('EGPC / Punta Catalina', 'egpc-punta-catalina', 'Flame', '#EF4444',
   'Generación termoeléctrica de Punta Catalina, costos de producción, facturación por EDE',
   'EGPC', 6),

  ('Resultados Financieros', 'resultados-financieros', 'BarChart3', '#EC4899',
   'Resultados financieros detallados: ingresos, gastos, compra de energía, OPEX y CAPEX por empresa',
   'Anexo Res Financieros', 7),

  ('Deuda con Generadoras', 'deuda-generadoras', 'AlertTriangle', '#F97316',
   'Deuda del sector con empresas generadoras privadas, desglose por empresa',
   'Anexo Deuda', 8),

  ('Régimen Tarifario', 'regimen-tarifario', 'Receipt', '#6366F1',
   'Cargos tarifarios por tipo de servicio y distribuidora (régimen actual y anterior)',
   'Nuevo Regimen tarifario', 9)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SECCIÓN 8: SEED DATA — INDICADORES (Variables Relevantes)
-- ============================================================

-- Categoría: Variables Relevantes
-- (Se asume que el seed de categorías ya creó el slug 'variables-relevantes')

INSERT INTO indicators (category_id, name, slug, unit, description, chart_type, sort_order) VALUES
  -- Precios Combustibles
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Fuel Oil #2 (US$/BBL)', 'fuel-oil-2-usd-bbl', 'US$/BBL',
   'Precio internacional del Fuel Oil No. 2 por barril', 'line', 1),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Fuel Oil #2 (US$/MMBTU)', 'fuel-oil-2-usd-mmbtu', 'US$/MMBTU',
   'Precio del Fuel Oil No. 2 por millón de BTU', 'line', 2),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Fuel Oil #6 (US$/BBL)', 'fuel-oil-6-usd-bbl', 'US$/BBL',
   'Precio internacional del Fuel Oil No. 6 por barril', 'line', 3),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Fuel Oil #6 (US$/MMBTU)', 'fuel-oil-6-usd-mmbtu', 'US$/MMBTU',
   'Precio del Fuel Oil No. 6 por millón de BTU', 'line', 4),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Gas Natural (US$/MMBTU)', 'gas-natural-usd-mmbtu', 'US$/MMBTU',
   'Precio del gas natural por millón de BTU', 'line', 5),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Carbón Mineral (US$/Ton)', 'carbon-mineral-usd-ton', 'US$/Ton',
   'Precio del carbón mineral por tonelada', 'line', 6),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Carbón Mineral (US$/MMBTU)', 'carbon-mineral-usd-mmbtu', 'US$/MMBTU',
   'Precio del carbón mineral por millón de BTU', 'line', 7),

  -- Generación por tipo
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Total Generación', 'total-generacion', 'GWh',
   'Generación total de energía eléctrica', 'area', 8),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Generación Carbón Mineral', 'generacion-carbon-mineral', 'GWh',
   'Generación de energía a partir de carbón mineral', 'bar', 9),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Generación Gas Natural', 'generacion-gas-natural', 'GWh',
   'Generación de energía a partir de gas natural', 'bar', 10),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Generación Fuel Oil #2', 'generacion-fuel-oil-2', 'GWh',
   'Generación de energía a partir de Fuel Oil No. 2', 'bar', 11),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Generación Fuel Oil #6', 'generacion-fuel-oil-6', 'GWh',
   'Generación de energía a partir de Fuel Oil No. 6', 'bar', 12),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Generación Hidráulica', 'generacion-hidraulica', 'GWh',
   'Generación de energía hidroeléctrica', 'bar', 13),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Generación Eólica', 'generacion-eolica', 'GWh',
   'Generación de energía eólica', 'bar', 14),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Generación Solar Fotovoltaica', 'generacion-solar-fv', 'GWh',
   'Generación de energía solar fotovoltaica', 'bar', 15),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Generación Biomasa', 'generacion-biomasa', 'GWh',
   'Generación de energía a partir de biomasa', 'bar', 16),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Total Renovable No Convencional', 'total-renovable-no-convencional', 'GWh',
   'Generación total de fuentes renovables no convencionales (eólica, solar, biomasa)', 'line', 17),

  -- Precios MEM
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Costo Marginal de Energía', 'costo-marginal-energia', 'cUSD/kWh',
   'Costo marginal de energía en el Mercado Eléctrico Mayorista', 'line', 18),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Costo Marginal de Potencia', 'costo-marginal-potencia', 'cUSD/kW-Mes',
   'Costo marginal de potencia en el Mercado Eléctrico Mayorista', 'line', 19),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Peaje de Transmisión', 'peaje-transmision', 'cUSD/kWh',
   'Peaje de transmisión en el MEM', 'line', 20),

  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Derecho de Conexión Unitario', 'derecho-conexion-unitario', 'USD/kW-Mes',
   'Derecho de conexión unitario en el MEM', 'line', 21),

  -- Tasa de cambio
  ((SELECT id FROM indicator_categories WHERE slug = 'variables-relevantes'),
   'Tasa de Cambio (DOP/USD)', 'tasa-cambio-dop-usd', 'DOP/USD',
   'Tasa de cambio oficial del peso dominicano respecto al dólar estadounidense', 'line', 22)
ON CONFLICT (slug) DO NOTHING;

-- Nota: Los indicadores de las demás categorías (EDEs, CDEEE, EGEHID, ETED, EGPC,
-- Resultados Financieros, Deuda, Tarifario) se agregarán via script de seed
-- automatizado que lee los nombres del XLS, para evitar errores manuales.

-- ============================================================
-- FIN DE MIGRATION
-- ============================================================
