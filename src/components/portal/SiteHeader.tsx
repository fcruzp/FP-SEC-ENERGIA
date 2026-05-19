'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface SiteHeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export default function SiteHeader({ onMenuToggle, isMenuOpen }: SiteHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);

      // Detect active section
      const sections = ['hero', 'about', 'observatory', 'news', 'documents', 'events', 'multimedia', 'subscribe'];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'hero', label: 'Inicio' },
    { id: 'about', label: 'Sobre Nosotros' },
    { id: 'observatory', label: 'Observatorio' },
    { id: 'news', label: 'Noticias' },
    { id: 'documents', label: 'Documentos' },
    { id: 'events', label: 'Eventos' },
    { id: 'multimedia', label: 'Multimedia' },
    { id: 'subscribe', label: 'Contacto' },
  ];

  return (
    <header id="site-header" className={scrolled ? 'solid' : 'transparent'}>
      <div className="header-inner">
        {/* Logo */}
        <a className="logo-area" href="#hero">
          <Image
            src="/fp-logo.png"
            alt="Fuerza del Pueblo"
            width={44}
            height={44}
            className="logo-img"
            priority
          />
          <div className="logo-text">
            <div className="line1">Fuerza del Pueblo</div>
            <div className="line2">Secretaría de Energía</div>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="main-nav">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeSection === item.id ? 'active' : ''}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* CTA + Hamburger */}
        <div className="header-cta">
          <a href="#news" className="btn btn-ghost">Comunicados</a>
          <a href="#subscribe" className="btn btn-primary">Suscribirse</a>
          <button
            className={`hamburger ${isMenuOpen ? 'open' : ''}`}
            onClick={onMenuToggle}
            aria-label="Abrir menú"
            aria-expanded={isMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
