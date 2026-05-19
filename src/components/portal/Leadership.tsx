'use client';

export default function Leadership() {
  const team = [
    { initials: 'JR', name: 'Dr. José Ramírez', pos: 'Secretario de Energía', badge: 'Titular', bg: 'linear-gradient(135deg,#0a2e19,#1a6b3c)', desc: 'Doctor en Ingeniería Eléctrica con más de 20 años de experiencia en política energética regional. Ex-director de la CDEEE y consultor de organismos multilaterales en materia de transición energética.' },
    { initials: 'MA', name: 'Ing. María Alonzo', pos: 'Directora de Energías Renovables', badge: 'Directora técnica', bg: 'linear-gradient(135deg,#0f4526,#2d9e5f)', desc: 'Especialista en sistemas fotovoltaicos y eólicos. Máster en Energías Renovables por la Universidad de Chile. Autora de múltiples estudios sobre potencial solar dominicano.' },
    { initials: 'CP', name: 'Lic. Carlos Pimentel', pos: 'Director de Política Tarifaria', badge: 'Economista', bg: 'linear-gradient(135deg,#134e2a,#3db870)', desc: 'Economista energético con especialización en regulación de mercados eléctricos. Investigador asociado al INTEC y consultor del Banco Interamericano de Desarrollo.' },
    { initials: 'LG', name: 'Dra. Laura Guerrero', pos: 'Directora de Sostenibilidad', badge: 'Analista', bg: 'linear-gradient(135deg,#0a2e19,#2d9e5f)', desc: 'Doctora en Ciencias Ambientales con enfoque en transición energética justa. Experta en financiamiento climático y mecanismos de carbono para economías emergentes.' },
  ];

  return (
    <section id="leadership">
      <div className="section-inner">
        <div className="section-header centered fade-up">
          <div className="section-label">Equipo directivo</div>
          <h2 className="section-title">Titular y equipo técnico</h2>
          <p className="section-desc">Profesionales especializados en política energética, ingeniería de sistemas eléctricos, economía y sostenibilidad ambiental.</p>
        </div>
        <div className="team-grid">
          {team.map((m, i) => (
            <div className="team-card fade-up" key={i}>
              <div className="team-card-photo" style={{background: m.bg}}>
                <div className="initials">{m.initials}</div>
                <span className="team-badge">{m.badge}</span>
              </div>
              <div className="team-card-body">
                <h3>{m.name}</h3>
                <div className="pos">{m.pos}</div>
                <p>{m.desc}</p>
              </div>
              <div className="team-card-footer">
                <a className="social-btn" href="#" title="LinkedIn">💼</a>
                <a className="social-btn" href="#" title="Twitter">🐦</a>
                <a className="social-btn" href="#" title="Email">✉️</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
