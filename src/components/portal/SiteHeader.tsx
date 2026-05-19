'use client';

import { useEffect, useState } from 'react';

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openMobileNav = () => {
    document.getElementById('mobileNav')?.classList.add('open');
  };

  return (
    <header id="site-header" className={scrolled ? 'solid' : 'transparent'}>
      <div className="header-inner">
        <a className="logo-area" href="#hero">
          <div className="logo-badge">FP</div>
          <div className="logo-text">
            <div className="line1">Fuerza del Pueblo</div>
            <div className="line2">Secretaría de Energía</div>
          </div>
        </a>
        <nav className="main-nav">
          <a href="#hero">Inicio</a>
          <a href="#about">Sobre Nosotros</a>
          <a href="#observatory">Observatorio</a>
          <a href="#news">Noticias</a>
          <a href="#documents">Documentos</a>
          <a href="#events">Eventos</a>
          <a href="#multimedia">Multimedia</a>
          <a href="#subscribe">Contacto</a>
        </nav>
        <div className="header-cta">
          <a href="#news" className="btn btn-ghost">Comunicados</a>
          <a href="#subscribe" className="btn btn-primary">Suscribirse</a>
          <div className="hamburger" onClick={openMobileNav}>
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </header>
  );
}
