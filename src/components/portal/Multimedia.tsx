'use client';

export default function Multimedia() {
  const items = [
    { icon: '🎙️', bg: 'linear-gradient(135deg,#0a2e19,#1a6b3c)', hasPlay: true, type: 'Video · Entrevista', title: 'Dr. Ramírez en CNN en Español: «La transformación energética de RD no puede esperar»' },
    { icon: '🌞', bg: 'linear-gradient(135deg,#0f4526,#3db870)', hasPlay: true, type: 'Video · Conferencia', title: 'Foro Solar RD 2024 — Resumen ejecutivo' },
    { icon: '📸', bg: 'linear-gradient(135deg,#134e2a,#2d9e5f)', hasPlay: false, type: 'Fotografía · Evento', title: 'Visita técnica a parque eólico Los Cocos' },
    { icon: '⚡', bg: 'linear-gradient(135deg,#0e7490,#06b6d4)', hasPlay: true, type: 'Video · Documental', title: 'Apagones en RD: causas, costos y soluciones' },
    { icon: '🏗️', bg: 'linear-gradient(135deg,#0a2e19,#4ade80)', hasPlay: false, type: 'Fotografía · Infraestructura', title: 'Inspección de subestaciones del norte del país' },
  ];

  return (
    <section id="multimedia">
      <div className="section-inner">
        <div className="section-header fade-up">
          <div className="section-label">Contenido multimedia</div>
          <h2 className="section-title">Galería multimedia</h2>
          <p className="section-desc">Entrevistas, foros, conferencias y fotografías del trabajo técnico y político de la Secretaría.</p>
        </div>
        <div className="gallery-grid fade-up">
          {items.map((item, i) => (
            <div className="gallery-item" key={i}>
              <div className="gallery-bg" style={{background: item.bg}}>{item.icon}</div>
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
    </section>
  );
}
