'use client';

import { useState } from 'react';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  SISTEMA DE GALERÍA MULTIMEDIA
 * ────────────────────────────────────────────────────────────────────────────
 *  Para agregar una nueva entrada: copia un objeto del array `mediaItems`,
 *  cambia sus campos, y colócalo al inicio del array (orden cronológico
 *  descendente). El primer item con `featured: true` se mostrará en el slot
 *  destacado grande; el resto aparecerá en la galería secundaria.
 *
 *  Campos:
 *    - id          identificador único (string)
 *    - type        categoría ('Video · Entrevista', 'Video · Conferencia', etc.)
 *    - title       título del contenido
 *    - summary     descripción larga (solo destacados)
 *    - icon        emoji representativo
 *    - bg          gradiente CSS de fondo para cards sin video real
 *    - hasPlay     true si muestra botón de play (video)
 *    - featured    true si debe mostrarse como destacado (solo el primero)
 *    - youtubeId   ID del video de YouTube (ej: 'y8p_0MLv9y0')
 *    - duration    duración legible (ej: '25:08')
 *    - date        fecha de publicación
 *    - author      autor / expositor (opcional)
 * ────────────────────────────────────────────────────────────────────────────
 */

interface MediaItem {
  id: string;
  type: string;
  title: string;
  summary?: string;
  icon: string;
  bg: string;
  hasPlay: boolean;
  featured?: boolean;
  youtubeId?: string;
  duration?: string;
  date?: string;
  author?: string;
  keyPoints?: string[];
}

const mediaItems: MediaItem[] = [
  {
    id: 'cuenta-publica-electrica-2026',
    type: 'Video · Aporte Sectorial',
    title:
      'Ing. Juan Gómez responde a rendición de cuentas eléctrica del gobierno: «Ficción, omisión y apagón»',
    summary:
      'El Ingeniero Juan Gómez, titular de la Secretaría de Energía de Fuerza del Pueblo, presenta una crítica detallada al discurso de rendición de cuentas del presidente Luis Abinader respecto al sector eléctrico. La postura del partido se resume bajo los conceptos de ficción, omisión y apagón.',
    icon: '⚡',
    bg: 'linear-gradient(135deg,#0a2e19,#1a6b3c)',
    hasPlay: true,
    featured: true,
    youtubeId: 'y8p_0MLv9y0',
    duration: '25:08',
    date: '2026',
    author: 'Ing. Juan Gómez · Secretario de Energía, FP',
    keyPoints: [
      'Cuestionamiento de la narrativa oficial frente a los informes técnicos a diciembre 2025',
      'Análisis de los apagones nacionales del 11 nov 2025 y 23 feb 2026 — fallas estructurales y falta de mantenimiento preventivo',
      'Pérdidas en distribución alcanzaron 38.8% en 2025; déficit del sector se ha triplicado vs. 2020',
      'Crítica a la incorporación de generación térmica costosa (barcazas bajo decretos de emergencia)',
      'Llamado a la acción: exigencia de respuestas sobre ejecución presupuestaria de la ETED',
      'Espacio de preguntas: dependencia de combustibles fósiles, situación en Medio Oriente y Pacto Eléctrico',
    ],
  },
  {
    id: 'malagestion-prm-crisis-electrica',
    type: 'Video · Denuncia',
    title:
      'La mala gestión del PRM provoca crisis eléctrica, denuncia Fuerza del Pueblo',
    icon: '⚡',
    bg: 'linear-gradient(135deg,#7f1d1d,#dc2626)',
    hasPlay: true,
    youtubeId: 'C1sD0jsBx58',
  },
  {
    id: 'leonel-no-privatizo-electricidad',
    type: 'Video · Aclaración',
    title:
      'Dirigente de la Fuerza del Pueblo aclara que Leonel Fernández no privatizó empresas de electricidad',
    icon: '📋',
    bg: 'linear-gradient(135deg,#0a2e19,#1a6b3c)',
    hasPlay: true,
    youtubeId: 'R_iiDUB-Hug',
  },
  {
    id: 'foro-solar-rd-2024',
    type: 'Video · Conferencia',
    title: 'Foro Solar RD 2024 — Resumen ejecutivo',
    icon: '🌞',
    bg: 'linear-gradient(135deg,#0f4526,#3db870)',
    hasPlay: true,
  },
  {
    id: 'visita-parque-eolico-los-cocos',
    type: 'Fotografía · Evento',
    title: 'Visita técnica a parque eólico Los Cocos',
    icon: '📸',
    bg: 'linear-gradient(135deg,#134e2a,#2d9e5f)',
    hasPlay: false,
  },
  {
    id: 'apagones-rd-causas-costos',
    type: 'Video · Documental',
    title: 'Apagones en RD: causas, costos y soluciones',
    icon: '⚡',
    bg: 'linear-gradient(135deg,#0e7490,#06b6d4)',
    hasPlay: true,
  },
  {
    id: 'inspeccion-subestaciones-norte',
    type: 'Fotografía · Infraestructura',
    title: 'Inspección de subestaciones del norte del país',
    icon: '🏗️',
    bg: 'linear-gradient(135deg,#0a2e19,#4ade80)',
    hasPlay: false,
  },
];

export default function Multimedia() {
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  const featuredItem = mediaItems.find((item) => item.featured) ?? mediaItems[0];
  const sideItems = mediaItems.filter((item) => item.id !== featuredItem.id);

  // Construye URL de embed de YouTube. activar API de aumento de privacidad
  // (no trackea cookies fuera del play).
  const youtubeEmbedUrl = (id: string) =>
    `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;

  return (
    <section id="multimedia">
      <div className="section-inner">
        <div className="section-header fade-up">
          <div className="section-label">Contenido multimedia</div>
          <h2 className="section-title">Galería multimedia</h2>
          <p className="section-desc">
            Entrevistas, foros, conferencias y fotografías del trabajo técnico y político de la Secretaría.
          </p>
        </div>

        {/* ───── Video destacado ───── */}
        <div className="multimedia-featured fade-up">
          <div className="multimedia-featured-grid">
            {/* Player de YouTube embebido */}
            <div className="multimedia-featured-video">
              {featuredItem.youtubeId ? (
                <iframe
                  src={youtubeEmbedUrl(featuredItem.youtubeId)}
                  title={featuredItem.title}
                  className="multimedia-iframe"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div
                  className="multimedia-featured-fallback"
                  style={{ background: featuredItem.bg }}
                >
                  <span>{featuredItem.icon}</span>
                </div>
              )}
            </div>

            {/* Metadata del destacado */}
            <div className="multimedia-featured-body">
              <div className="multimedia-featured-tag">
                ✦ Destacado · {featuredItem.type}
              </div>
              <h3>{featuredItem.title}</h3>
              {featuredItem.author && (
                <p className="multimedia-featured-author">
                  {featuredItem.author}
                </p>
              )}
              {featuredItem.summary && (
                <p className="multimedia-featured-summary">
                  {featuredItem.summary}
                </p>
              )}
              {featuredItem.keyPoints && featuredItem.keyPoints.length > 0 && (
                <ul className="multimedia-featured-points">
                  {featuredItem.keyPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              )}
              <div className="multimedia-featured-meta">
                {featuredItem.date && (
                  <span>📅 {featuredItem.date}</span>
                )}
                {featuredItem.duration && (
                  <span>⏱ {featuredItem.duration}</span>
                )}
                {featuredItem.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${featuredItem.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="multimedia-featured-link"
                  >
                    Ver en YouTube ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ───── Galería secundaria ───── */}
        <div className="gallery-grid fade-up">
          {sideItems.map((item) => (
            <div
              className="gallery-item"
              key={item.id}
              onClick={() => item.youtubeId && setActiveMedia(item)}
              style={{ cursor: item.youtubeId ? 'pointer' : 'default' }}
            >
              <div className="gallery-bg" style={{ background: item.bg }}>
                {item.icon}
              </div>
              <div className="gallery-overlay"></div>
              {item.hasPlay && <div className="play-btn">▶</div>}
              <div className="gallery-info">
                <div className="type">{item.type}</div>
                <h4>{item.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ───── Modal para videos secundarios ───── */}
      {activeMedia && activeMedia.youtubeId && (
        <div
          className="multimedia-modal"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="multimedia-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="multimedia-modal-close"
              onClick={() => setActiveMedia(null)}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <iframe
              src={youtubeEmbedUrl(activeMedia.youtubeId)}
              title={activeMedia.title}
              className="multimedia-iframe"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="multimedia-modal-info">
              <div className="type">{activeMedia.type}</div>
              <h4>{activeMedia.title}</h4>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
