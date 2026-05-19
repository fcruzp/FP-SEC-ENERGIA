'use client';

import { useState } from 'react';

export default function News() {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const filters = ['Todos', 'Renovables', 'Tarifas', 'Política energética', 'Infraestructura', 'Comunicados'];

  return (
    <section id="news">
      <div className="section-inner">
        <div className="section-header fade-up">
          <div className="section-label">Sala de prensa</div>
          <h2 className="section-title">Noticias y comunicados</h2>
        </div>
        <div className="news-filter fade-up">
          {filters.map(f => (
            <button key={f} className={`filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
          <div className="news-search">
            <input type="text" placeholder="Buscar noticias..."/>
            <button>🔍</button>
          </div>
        </div>
        <div className="news-layout fade-up">
          <div className="news-featured">
            <div className="news-featured-bg">☀️</div>
            <div className="news-featured-overlay"></div>
            <div className="news-featured-body">
              <div className="news-tag">✦ Destacado</div>
              <h2>Secretaría de Energía presenta plan de expansión solar para las regiones del Cibao y el Sur</h2>
              <p>El documento técnico propone instalar 500 MW de capacidad fotovoltaica distribuida en zonas rurales con alta irradiación solar, priorizando comunidades sin acceso estable.</p>
              <div className="news-meta">
                <span>📅 15 enero 2025</span>
                <span>⏱ 8 min de lectura</span>
                <span>👁 4,230 vistas</span>
              </div>
            </div>
          </div>
          <div className="news-list">
            <div className="news-card">
              <div className="news-card-icon">⚡</div>
              <div className="news-card-body">
                <div className="news-tag" style={{marginBottom:8,display:'inline-flex'}}>Tarifas</div>
                <h4>Análisis: El impacto de los nuevos subsidios eléctricos en los hogares de bajos ingresos</h4>
                <p>Estudio comparativo con experiencias de México, Costa Rica y Colombia.</p>
                <div className="news-card-meta"><span>📅 12 ene 2025</span><span>⏱ 5 min</span></div>
              </div>
            </div>
            <div className="news-card">
              <div className="news-card-icon">🌊</div>
              <div className="news-card-body">
                <div className="news-tag" style={{marginBottom:8,display:'inline-flex'}}>Infraestructura</div>
                <h4>Secretaría evalúa potencial hidroeléctrico del río Yaque del Norte con nuevo levantamiento técnico</h4>
                <p>El estudio fue desarrollado junto al Instituto Geográfico Nacional y el IDIAF.</p>
                <div className="news-card-meta"><span>📅 8 ene 2025</span><span>⏱ 4 min</span></div>
              </div>
            </div>
            <div className="news-card">
              <div className="news-card-icon">📋</div>
              <div className="news-card-body">
                <div className="news-tag" style={{marginBottom:8,display:'inline-flex'}}>Comunicado</div>
                <h4>Comunicado oficial: Posición de FP ante el nuevo reglamento de generación distribuida</h4>
                <p>La Secretaría exige que el marco regulatorio garantice la participación ciudadana.</p>
                <div className="news-card-meta"><span>📅 3 ene 2025</span><span>⏱ 3 min</span></div>
              </div>
            </div>
            <div className="news-card">
              <div className="news-card-icon">🌍</div>
              <div className="news-card-body">
                <div className="news-tag" style={{marginBottom:8,display:'inline-flex'}}>Renovables</div>
                <h4>RD puede alcanzar el 50% de energía renovable antes de 2035 según nuevo informe</h4>
                <p>Análisis elaborado por el equipo técnico de la Secretaría con apoyo de IRENA.</p>
                <div className="news-card-meta"><span>📅 28 dic 2024</span><span>⏱ 6 min</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
