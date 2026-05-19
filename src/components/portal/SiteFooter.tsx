export default function SiteFooter() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <a className="logo-area" href="#hero">
              <div className="logo-badge">FP</div>
              <div className="logo-text">
                <div className="line1">Fuerza del Pueblo</div>
                <div className="line2">Secretaría de Energía</div>
              </div>
            </a>
            <p>El organismo técnico-político de Fuerza del Pueblo dedicado a la formulación de propuestas y visión estratégica para transformar el sector energético de la República Dominicana.</p>
          </div>
          <div className="footer-col">
            <h4>Navegación</h4>
            <ul>
              <li><a href="#hero">Inicio</a></li>
              <li><a href="#about">Sobre Nosotros</a></li>
              <li><a href="#observatory">Observatorio</a></li>
              <li><a href="#news">Noticias</a></li>
              <li><a href="#documents">Documentos</a></li>
              <li><a href="#events">Eventos</a></li>
              <li><a href="#multimedia">Multimedia</a></li>
              <li><a href="#subscribe">Contacto</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Líneas de acción</h4>
            <ul>
              <li><a href="#areas">Sistema eléctrico</a></li>
              <li><a href="#areas">Energías renovables</a></li>
              <li><a href="#areas">Tarifas eléctricas</a></li>
              <li><a href="#areas">Seguridad energética</a></li>
              <li><a href="#areas">Sostenibilidad</a></li>
              <li><a href="#areas">Transición energética</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <div className="footer-contact-item"><span className="ico">📍</span><span>Av. Abraham Lincoln, Torre FP, Piso 8, Santo Domingo</span></div>
            <div className="footer-contact-item"><span className="ico">📞</span><span>(809) 000-0000</span></div>
            <div className="footer-contact-item"><span className="ico">✉️</span><span>energia@fuerzadelpueblo.org.do</span></div>
            <div className="footer-contact-item"><span className="ico">🌐</span><span>fuerzadelpueblo.org.do</span></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Secretaría de Energía — Fuerza del Pueblo. Todos los derechos reservados.</span>
          <div className="footer-legal">
            <a href="#">Política de privacidad</a>
            <a href="#">Términos de uso</a>
            <a href="#">Accesibilidad</a>
            <a href="#">Mapa del sitio</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
