// Tipos de Supabase para el Observatorio y Foro
// Generados manualmente basados en el schema de 001_observatorio_foro_schema.sql

// ============================================================
// OBSERVATORIO ENERGÉTICO
// ============================================================

export type EntityType =
  | 'distribuidora'
  | 'generadora'
  | 'transmisora'
  | 'comercializadora'
  | 'generadora_privada'
  | 'regulador'

export interface Entity {
  id: string
  name: string
  slug: string
  type: EntityType
  parent_id: string | null
  sort_order: number
  created_at: string
}

export interface IndicatorCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  description: string | null
  source_sheet: string | null
  sort_order: number
  created_at: string
}

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'gauge' | 'sparkline'

export interface Indicator {
  id: string
  category_id: string
  entity_id: string | null
  name: string
  slug: string
  unit: string
  description: string | null
  source: string
  frequency: Frequency
  chart_type: ChartType
  is_breakdown: boolean
  parent_indicator_id: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  // Relaciones (no en BD, se join manualmente)
  category?: IndicatorCategory
  entity?: Entity
  parent_indicator?: Indicator
}

export type PeriodType = 'monthly' | 'quarterly' | 'yearly'

export interface DataPoint {
  id: string
  indicator_id: string
  entity_id: string | null
  value: number
  date: string
  period_type: PeriodType
  source_file: string | null
  is_estimated: boolean
  notes: string | null
  created_at: string
}

export interface Report {
  id: string
  title: string
  slug: string
  description: string | null
  file_url: string
  file_type: 'pdf' | 'xls' | 'xlsx' | 'csv'
  file_size: number | null
  publish_date: string | null
  source_org: string
  report_type: string
  phase: string
  is_published: boolean
  uploaded_by: number | null
  created_at: string
}

export interface AiAnalysisLog {
  id: string
  indicator_id: string | null
  category_id: string | null
  user_id: number | null
  user_query: string
  ai_response: string
  model_used: string | null
  tokens_used: number | null
  cost_usd: number | null
  created_at: string
}

// ============================================================
// FORO CIUDADANO
// ============================================================

export type ForumRole = 'citizen' | 'moderator' | 'admin'
export type PostCategory = 'Propuesta' | 'Informe' | 'Consulta' | 'Evento' | 'Anuncio'
export type ReactionType = 'like' | 'agree' | 'disagree' | 'flag'
export type TargetType = 'post' | 'comment'
export type ReportReason = 'spam' | 'offensive' | 'misinformation' | 'irrelevant' | 'other'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'

export interface Profile {
  id: number
  display_name: string
  role: ForumRole
  is_banned: boolean
  ban_reason: string | null
  banned_at: string | null
  banned_by: number | null
  is_shadow_banned: boolean
  comment_count: number
  first_comment_approved: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  cover_image_url: string | null
  category: PostCategory | null
  is_pinned: boolean
  is_locked: boolean
  is_published: boolean
  comment_count: number
  reaction_count: number
  published_at: string
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  post_id: string
  author_id: number
  parent_id: string | null
  content: string
  is_hidden: boolean
  hidden_by: number | null
  hidden_reason: string | null
  is_auto_hidden: boolean
  reaction_count: number
  created_at: string
  updated_at: string
}

export interface Reaction {
  id: string
  user_id: number
  target_id: string
  target_type: TargetType
  reaction_type: ReactionType
  created_at: string
}

export interface ContentReport {
  id: string
  reporter_id: number
  target_id: string
  target_type: TargetType | 'user'
  reason: ReportReason
  description: string | null
  status: ReportStatus
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string
}

export interface BannedWord {
  id: string
  word: string
  is_auto_hide: boolean
  created_at: string
}

// ============================================================
// HELPERS — Tipos compuestos para la UI
// ============================================================

export interface IndicatorWithData extends Indicator {
  data_points: DataPoint[]
  latest_value: number | null
  latest_date: string | null
  previous_value: number | null
  change: number | null
  change_pct: number | null
}

export interface CategoryWithIndicators extends IndicatorCategory {
  indicators: Indicator[]
  indicator_count: number
}

export interface PostWithAuthor extends Post {
  author: {
    id: number
    display_name: string
    avatar_url: string | null
  } | null
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: number
    display_name: string
    avatar_url: string | null
  } | null
  replies?: CommentWithAuthor[]
}
