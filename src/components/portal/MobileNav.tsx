'use client';

export default function MobileNav() {
  const closeMobileNav = () => {
    document.getElementById('mobileNav')?.classList.remove('open');
  };

  return (
    <div className="mobile-nav" id="mobileNav">
      <button className="mobile-nav-close" onClick={closeMobileNav}>✕</button>
      <a href="#hero" onClick={closeMobileNav}>Inicio</a>
      <a href="#about" onClick={closeMobileNav}>Sobre Nosotros</a>
      <a href="#observatory" onClick={closeMobileNav}>Observatorio</a>
      <a href="#news" onClick={closeMobileNav}>Noticias</a>
      <a href="#documents" onClick={closeMobileNav}>Documentos</a>
      <a href="#events" onClick={closeMobileNav}>Eventos</a>
      <a href="#multimedia" onClick={closeMobileNav}>Multimedia</a>
      <a href="#subscribe" onClick={closeMobileNav}>Contacto</a>
    </div>
  );
}
