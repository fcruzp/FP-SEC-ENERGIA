'use client';

import { useState } from 'react';

export default function Subscribe() {
  const [email, setEmail] = useState('');

  return (
    <section id="subscribe">
      <div className="section-inner">
        <div className="section-header centered fade-up">
          <div className="section-label">Mantente informado</div>
          <h2 className="section-title">Suscríbete y contáctanos</h2>
          <p className="section-desc">Recibe análisis, informes y comunicados directamente en tu correo. También puedes escribirnos.</p>
        </div>
        <div className="subscribe-grid">
          <div className="subscribe-left fade-up">
            <div className="subscribe-form">
              <h3 className="subscribe-form-title">Envíanos un mensaje</h3>
              <div className="form-row">
                <div className="form-group"><label>Nombre</label><input type="text" placeholder="Su nombre"/></div>
                <div className="form-group"><label>Apellido</label><input type="text" placeholder="Su apellido"/></div>
              </div>
              <div className="form-group"><label>Correo electrónico</label><input type="email" placeholder="correo@ejemplo.com"/></div>
              <div className="form-group">
                <label>Institución / Organización</label>
                <input type="text" placeholder="Nombre de su institución (opcional)"/>
              </div>
              <div className="form-group">
                <label>Tema</label>
                <select><option>Seleccione un tema...</option><option>Energías renovables</option><option>Tarifas eléctricas</option><option>Infraestructura</option><option>Prensa y medios</option><option>Otro</option></select>
              </div>
              <div className="form-group"><label>Mensaje</label><textarea placeholder="Escriba su mensaje aquí..."></textarea></div>
              <button className="btn btn-primary subscribe-submit-btn">Enviar mensaje →</button>
            </div>
          </div>
          <div className="subscribe-right fade-up">
            <div className="subscribe-newsletter-box">
              <h3 className="newsletter-title">Suscripción al boletín</h3>
              <p className="newsletter-desc">Análisis semanales, informes técnicos y comunicados oficiales de la Secretaría de Energía.</p>
              <div className="newsletter-form">
                <input
                  type="email"
                  className="newsletter-input"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn btn-primary newsletter-btn">Suscribirse</button>
              </div>
            </div>
            <div className="socials-grid">
              <a className="social-card" href="#">
                <div className="si" style={{background:'rgba(29,161,242,0.1)'}}>𝕏</div>
                <div><div className="sn">Twitter / X</div><div className="sh">@fpueblo_energia</div></div>
              </a>
              <a className="social-card" href="#">
                <div className="si" style={{background:'rgba(24,119,242,0.1)'}}>f</div>
                <div><div className="sn">Facebook</div><div className="sh">FuerzaDelPuebloRD</div></div>
              </a>
              <a className="social-card" href="#">
                <div className="si" style={{background:'rgba(225,48,108,0.1)'}}>📸</div>
                <div><div className="sn">Instagram</div><div className="sh">@fp.energia</div></div>
              </a>
              <a className="social-card" href="#">
                <div className="si" style={{background:'rgba(255,0,0,0.08)'}}>▶</div>
                <div><div className="sn">YouTube</div><div className="sh">SecEnergíaFP</div></div>
              </a>
            </div>
            <div className="subscribe-contact-box">
              <h4 className="contact-box-title">📍 Contacto directo</h4>
              <p className="contact-box-info">
                Av. Abraham Lincoln, esq. Gustavo Mejía Ricart,<br/>
                Torre FP, Piso 8, Santo Domingo, D.N.<br/>
                📞 (809) 000-0000<br/>
                ✉️ energia@fuerzadelpueblo.org.do
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
