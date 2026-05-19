'use client';

import { useState } from 'react';

export default function Documents() {
  const [activeType, setActiveType] = useState('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const types = ['Todos', 'Informes', 'Propuestas', 'Estudios', 'Presentaciones'];

  const docs = [
    { icon: '📄', iconClass: 'pdf', typeBadge: 'PDF · INFORME', title: 'Plan Estratégico de Transición Energética 2025–2035', desc: 'Hoja de ruta integral para la descarbonización progresiva de la matriz energética dominicana con metas, financiamiento y cronograma.', date: '📅 Enero 2025 · 84 págs.' },
    { icon: '📄', iconClass: 'pdf', typeBadge: 'PDF · ESTUDIO', title: 'Diagnóstico del Sistema Eléctrico Nacional 2024', desc: 'Evaluación técnica y financiera de las empresas distribuidoras, pérdidas, subsidios y calidad del servicio en todo el país.', date: '📅 Dic 2024 · 120 págs.' },
    { icon: '📊', iconClass: 'ppt', typeBadge: 'PPT · PRESENTACIÓN', title: 'Potencial Solar de la República Dominicana', desc: 'Mapeo geoespacial del recurso solar nacional con análisis de viabilidad técnica y económica por provincia y municipio.', date: '📅 Nov 2024 · 48 diapositivas' },
    { icon: '📝', iconClass: 'doc', typeBadge: 'DOC · PROPUESTA', title: 'Anteproyecto de Ley de Energías Renovables', desc: 'Propuesta legislativa completa que establece los incentivos, regulaciones y mecanismos de financiamiento para las energías limpias.', date: '📅 Oct 2024 · 36 págs.' },
    { icon: '📄', iconClass: 'pdf', typeBadge: 'PDF · INFORME', title: 'Análisis Tarifario Comparado: RD vs. Centroamérica', desc: 'Estudio comparativo de las estructuras tarifarias eléctricas de ocho países, con lecciones aplicables al mercado dominicano.', date: '📅 Sep 2024 · 62 págs.' },
    { icon: '📊', iconClass: 'ppt', typeBadge: 'PPT · INFORME', title: 'Estado del Arte: Almacenamiento Energético en RD', desc: 'Revisión del estado actual de las tecnologías de almacenamiento de energía y su aplicabilidad en la red eléctrica nacional.', date: '📅 Ago 2024 · 40 págs.' },
  ];

  return (
    <section id="documents">
      <div className="section-inner">
        <div className="section-header fade-up">
          <div className="section-label">Repositorio institucional</div>
          <h2 className="section-title">Documentos y estudios</h2>
          <p className="section-desc">Acceda a nuestros informes técnicos, propuestas de ley, estudios sectoriales y documentos de política pública.</p>
        </div>
        <div className="docs-toolbar fade-up">
          <div className="docs-types">
            {types.map(t => (
              <button key={t} className={`filter-btn ${activeType === t ? 'active' : ''}`} onClick={() => setActiveType(t)}>{t}</button>
            ))}
          </div>
          <div className="docs-toggle">
            <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>▦ Cuadrícula</button>
            <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰ Lista</button>
          </div>
        </div>
        <div className="docs-grid">
          {docs.map((d, i) => (
            <div className="doc-card fade-up" key={i}>
              <div className="doc-header">
                <div className={`doc-icon ${d.iconClass}`}>{d.icon}</div>
                <div><div className="doc-type-badge">{d.typeBadge}</div><h4>{d.title}</h4></div>
              </div>
              <p>{d.desc}</p>
              <div className="doc-footer">
                <span className="doc-date">{d.date}</span>
                <button className="doc-dl">⬇ Descargar</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
