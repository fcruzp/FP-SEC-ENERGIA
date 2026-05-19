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
              <h3 style={{fontSize:'1.1rem',fontWeight:700,color:'var(--graphite)',marginBottom:24}}>Envíanos un mensaje</h3>
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
              <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',padding:14}}>Enviar mensaje →</button>
            </div>
          </div>
          <div className="subscribe-right fade-up">
            <div style={{background:'var(--green-deep)',borderRadius:'var(--radius-lg)',padding:36,marginBottom:24}}>
              <h3 style={{fontSize:'1.1rem',fontWeight:700,color:'white',marginBottom:8}}>Suscripción al boletín</h3>
              <p style={{fontSize:13,color:'rgba(255,255,255,0.6)',lineHeight:1.7,marginBottom:24}}>Análisis semanales, informes técnicos y comunicados oficiales de la Secretaría de Energía.</p>
              <div style={{display:'flex',gap:10}}>
                <input type="email" placeholder="Tu correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} style={{flex:1,padding:'12px 16px',borderRadius:10,border:'1.5px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.08)',color:'white',fontFamily:'var(--font-inter)',fontSize:13,outline:'none'}}/>
                <button className="btn btn-primary" style={{whiteSpace:'nowrap'}}>Suscribirse</button>
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
            <div style={{marginTop:24,padding:24,background:'var(--gray-border)',borderRadius:'var(--radius)'}}>
              <h4 style={{fontSize:13,fontWeight:700,color:'var(--graphite)',marginBottom:8}}>📍 Contacto directo</h4>
              <p style={{fontSize:12,color:'var(--gray-mid)',lineHeight:1.8}}>
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
