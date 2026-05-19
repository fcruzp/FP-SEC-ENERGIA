'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [activeSection, setActiveSection] = useState('hero');

  // Track active section
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
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
    handleScroll();
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navItems = [
    { id: 'hero', label: 'Inicio', icon: '🏠' },
    { id: 'about', label: 'Sobre Nosotros', icon: '🏛️' },
    { id: 'observatory', label: 'Observatorio', icon: '📊' },
    { id: 'news', label: 'Noticias', icon: '📰' },
    { id: 'documents', label: 'Documentos', icon: '📄' },
    { id: 'events', label: 'Eventos', icon: '📅' },
    { id: 'multimedia', label: 'Multimedia', icon: '🎬' },
    { id: 'subscribe', label: 'Contacto', icon: '✉️' },
  ];

  const handleNavClick = useCallback((id: string) => {
    onClose();
    // Small delay for the drawer animation to start before scrolling
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`mobile-nav-overlay ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className={`mobile-nav-drawer ${isOpen ? 'open' : ''}`} id="mobileNav">
        {/* Drawer Header */}
        <div className="mobile-drawer-header">
          <a className="logo-area" href="#hero" onClick={() => handleNavClick('hero')}>
            <Image
              src="/fp-logo.png"
              alt="Fuerza del Pueblo"
              width={36}
              height={36}
              className="logo-img"
            />
            <div className="logo-text">
              <div className="line1">Fuerza del Pueblo</div>
              <div className="line2">Secretaría de Energía</div>
            </div>
          </a>
          <button className="mobile-nav-close" onClick={onClose} aria-label="Cerrar menú">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav Links */}
        <nav className="mobile-nav-links">
          {navItems.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`mobile-nav-link ${activeSection === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id);
              }}
              style={{ animationDelay: isOpen ? `${index * 0.05 + 0.1}s` : '0s' }}
            >
              <span className="mobile-nav-icon">{item.icon}</span>
              <span className="mobile-nav-label">{item.label}</span>
              {activeSection === item.id && <span className="mobile-nav-indicator" />}
            </a>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="mobile-nav-cta">
          <a href="#news" className="btn btn-ghost btn-large btn-full" onClick={() => handleNavClick('news')}>
            Comunicados
          </a>
          <a href="#subscribe" className="btn btn-primary btn-large btn-full" onClick={() => handleNavClick('subscribe')}>
            Suscribirse
          </a>
        </div>
      </div>
    </>
  );
}
