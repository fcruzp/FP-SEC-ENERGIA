'use client';

import Link from 'next/link';
import { TEAM } from '@/lib/team';

export default function Leadership() {
  return (
    <section id="leadership">
      <div className="section-inner">
        <div className="section-header centered fade-up">
          <div className="section-label">Equipo directivo</div>
          <h2 className="section-title">Titular y equipo técnico</h2>
          <p className="section-desc">Profesionales especializados en política energética, ingeniería de sistemas eléctricos, economía y sostenibilidad ambiental.</p>
        </div>
        <div className="team-grid">
          {TEAM.map((m) => {
            const href = m.profile ? `/equipo/${m.slug}` : null;
            const photo = (
              <div className="team-card-photo" style={{background: m.bg}}>
                {m.photo ? (
                  <>
                    <img className="team-photo-img" src={m.photo} alt={m.name} />
                    <div className="team-photo-overlay"></div>
                  </>
                ) : (
                  <div className="initials">{m.initials}</div>
                )}
                <span className="team-badge">{m.badge}</span>
              </div>
            );
            return (
              <div className="team-card fade-up" key={m.slug}>
                {href ? <Link href={href} aria-label={`Semblanza de ${m.name}`}>{photo}</Link> : photo}
                <div className="team-card-body">
                  <h3>{href ? <Link href={href} className="team-card-link">{m.name}</Link> : m.name}</h3>
                  <div className="pos">{m.pos}</div>
                  <p>{m.desc}</p>
                  {href && <Link href={href} className="team-card-more">Ver semblanza completa →</Link>}
                </div>
                <div className="team-card-footer">
                  <a className="social-btn" href="#" title="LinkedIn">💼</a>
                  <a className="social-btn" href="#" title="Twitter">🐦</a>
                  <a className="social-btn" href="#" title="Email">✉️</a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
