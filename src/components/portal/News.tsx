'use client';

import { useState, useMemo } from 'react';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  SISTEMA DE NOTICIAS Y COMUNICADOS
 * ────────────────────────────────────────────────────────────────────────────
 *  Para agregar una nueva entrada: copia un objeto del array `newsItems`,
 *  cambia sus campos, y colócalo al inicio del array (orden cronológico
 *  descendente). El primer item con `featured: true` se mostrará en el
 *  bloque destacado grande; el resto aparecerá en la lista lateral.
 *
 *  Campos:
 *    - id            identificador único (string)
 *    - title         título de la noticia
 *    - summary       resumen corto (1-2 frases)
 *    - date          fecha en formato legible ('15 enero 2025')
 *    - readTime      tiempo de lectura ('8 min')
 *    - views         vistas (opcional, solo destacados)
 *    - category      una de las categorías del array `filters`
 *    - icon          emoji representativo
 *    - featured      true si debe mostrarse como destacado (solo el primero)
 *    - documentUrl   URL del documento asociado (opcional)
 *    - documentLabel etiqueta del botón de descarga (opcional)
 * ────────────────────────────────────────────────────────────────────────────
 */

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  readTime: string;
  views?: string;
  category: string;
  icon: string;
  featured?: boolean;
  documentUrl?: string;
  documentLabel?: string;
  author?: string;
}

const newsItems: NewsItem[] = [
  {
    id: 'diagnostico-renovables-2025',
    title:
      'Diagnóstico de Fuentes Renovables en República Dominicana (Periodo 2007–2025)',
    summary:
      'La División de Energías Renovables y Eficiencia Energética presenta el primer diagnóstico técnico integral sobre la trayectoria del subsector renovable dominicano. El documento evalúa la capacidad instalada, los incentivos de la Ley 57-07, el cumplimiento de las metas del Acuerdo de París y los desafíos para alcanzar el 25% de generación renovable al 2030.',
    date: '27 junio 2026',
    readTime: '15 min de lectura',
    views: '1,240 vistas',
    category: 'Renovables',
    icon: '☀️',
    featured: true,
    documentUrl: '/documents/diagnostico-fuentes-renovables-2007-2025.pdf',
    documentLabel: 'Descargar documento PDF',
    author: 'División de Energías Renovables y EE.',
  },
  {
    id: 'analisis-subsidios-electricos',
    title:
      'Análisis: El impacto de los nuevos subsidios eléctricos en los hogares de bajos ingresos',
    summary:
      'Estudio comparativo con experiencias de México, Costa Rica y Colombia.',
    date: '12 ene 2025',
    readTime: '5 min',
    category: 'Tarifas',
    icon: '⚡',
  },
  {
    id: 'potencial-hidroelectrico-yaque',
    title:
      'Secretaría evalúa potencial hidroeléctrico del río Yaque del Norte con nuevo levantamiento técnico',
    summary:
      'El estudio fue desarrollado junto al Instituto Geográfico Nacional y el IDIAF.',
    date: '8 ene 2025',
    readTime: '4 min',
    category: 'Infraestructura',
    icon: '🌊',
  },
  {
    id: 'comunicado-generacion-distribuida',
    title:
      'Comunicado oficial: Posición de FP ante el nuevo reglamento de generación distribuida',
    summary:
      'La Secretaría exige que el marco regulatorio garantice la participación ciudadana.',
    date: '3 ene 2025',
    readTime: '3 min',
    category: 'Comunicados',
    icon: '📋',
  },
  {
    id: 'rd-50-renovable-2035',
    title:
      'RD puede alcanzar el 50% de energía renovable antes de 2035 según nuevo informe',
    summary:
      'Análisis elaborado por el equipo técnico de la Secretaría con apoyo de IRENA.',
    date: '28 dic 2024',
    readTime: '6 min',
    category: 'Renovables',
    icon: '🌍',
  },
];

const filters = [
  'Todos',
  'Renovables',
  'Tarifas',
  'Política energética',
  'Infraestructura',
  'Comunicados',
];

export default function News() {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // El primer item featured se muestra en el slot destacado grande.
  const featuredItem = newsItems.find((item) => item.featured) ?? newsItems[0];

  // Los items laterales son todos los demás, opcionalmente filtrados.
  const sideItems = useMemo(() => {
    let items = newsItems.filter((item) => item.id !== featuredItem.id);
    if (activeFilter !== 'Todos') {
      items = items.filter((item) => item.category === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q)
      );
    }
    return items;
  }, [activeFilter, searchQuery, featuredItem.id]);

  return (
    <section id="news">
      <div className="section-inner">
        <div className="section-header fade-up">
          <div className="section-label">Sala de prensa</div>
          <h2 className="section-title">Noticias y comunicados</h2>
        </div>
        <div className="news-filter fade-up">
          {filters.map((f) => (
            <button
              key={f}
              className={`filter-btn ${activeFilter === f ? 'active' : ''}`}
              onClick={() => setActiveFilter(f)}
              style={{ cursor: 'pointer' }}
            >
              {f}
            </button>
          ))}
          <div className="news-search">
            <input
              type="text"
              placeholder="Buscar noticias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button style={{ cursor: 'pointer' }}>🔍</button>
          </div>
        </div>
        <div className="news-layout fade-up">
          {/* ───── Destacado ───── */}
          <div className="news-featured">
            <div className="news-featured-bg">{featuredItem.icon}</div>
            <div className="news-featured-overlay"></div>
            <div className="news-featured-body">
              <div className="news-tag">✦ Destacado</div>
              <h2>{featuredItem.title}</h2>
              <p>{featuredItem.summary}</p>
              {featuredItem.author && (
                <p
                  style={{
                    fontSize: '0.8rem',
                    opacity: 0.75,
                    marginBottom: 8,
                    fontStyle: 'italic',
                  }}
                >
                  Elaborado por: {featuredItem.author}
                </p>
              )}
              <div className="news-meta">
                <span>📅 {featuredItem.date}</span>
                <span>⏱ {featuredItem.readTime}</span>
                {featuredItem.views && <span>👁 {featuredItem.views}</span>}
              </div>
              {featuredItem.documentUrl && (
                <a
                  href={featuredItem.documentUrl}
                  download
                  className="news-download-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 16,
                    padding: '10px 18px',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 10,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  📄 {featuredItem.documentLabel || 'Descargar documento'}
                </a>
              )}
            </div>
          </div>

          {/* ───── Lista lateral ───── */}
          <div className="news-list">
            {sideItems.length === 0 ? (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.85rem',
                }}
              >
                No hay noticias que coincidan con la búsqueda.
              </div>
            ) : (
              sideItems.map((item) => (
                <div className="news-card" key={item.id}>
                  <div className="news-card-icon">{item.icon}</div>
                  <div className="news-card-body">
                    <div
                      className="news-tag"
                      style={{ marginBottom: 8, display: 'inline-flex' }}
                    >
                      {item.category}
                    </div>
                    <h4>{item.title}</h4>
                    <p>{item.summary}</p>
                    <div className="news-card-meta">
                      <span>📅 {item.date}</span>
                      <span>⏱ {item.readTime}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
