'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/portal/SiteHeader';
import SiteFooter from '@/components/portal/SiteFooter';
import MobileNav from '@/components/portal/MobileNav';
import AnimationObserver from '@/components/portal/AnimationObserver';
import { mediaItems, type MediaItem } from '@/components/portal/Multimedia';

export default function MultimediaArchivePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  const toggleMenu = () => setIsMenuOpen((p) => !p);
  const closeMenu = () => setIsMenuOpen(false);

  // Lock scroll when modal open
  useEffect(() => {
    if (activeMedia) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeMedia]);

  const featuredItem = mediaItems.find((item) => item.featured) ?? mediaItems[0];
  const allItems = mediaItems;

  const youtubeEmbedUrl = (id: string) =>
    `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;

  return (
    <>
      <AnimationObserver />
      <MobileNav isOpen={isMenuOpen} onClose={closeMenu} />
      <SiteHeader onMenuToggle={toggleMenu} isMenuOpen={isMenuOpen} />

      <main className="multimedia-archive-page">
        {/* ─── Page hero ─── */}
        <section className="archive-hero">
          <div className="section-inner">
            <div className="archive-breadcrumb">
              <Link href="/#multimedia">← Volver al portal</Link>
            </div>
            <div className="section-label">Archivo histórico</div>
            <h1 className="archive-title">Galería multimedia completa</h1>
            <p className="archive-desc">
              Catálogo cronológico de entrevistas, foros, conferencias, documentales
              y registros fotográficos del trabajo técnico y político de la
              Secretaría de Energía de Fuerza del Pueblo.
            </p>
            <div className="archive-stats">
              <div className="archive-stat">
                <span className="archive-stat-num">{allItems.length}</span>
                <span className="archive-stat-label">contenidos totales</span>
              </div>
              <div className="archive-stat">
                <span className="archive-stat-num">
                  {allItems.filter((i) => i.youtubeId).length}
                </span>
                <span className="archive-stat-label">videos disponibles</span>
              </div>
              <div className="archive-stat">
                <span className="archive-stat-num">
                  {allItems.filter((i) => !i.youtubeId).length}
                </span>
                <span className="archive-stat-label">registros en archivo</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Featured item ─── */}
        <section className="archive-featured-section">
          <div className="section-inner">
            <div className="section-header fade-up">
              <div className="section-label">Contenido destacado</div>
              <h2 className="section-title">Lo más reciente</h2>
            </div>
            <div className="multimedia-featured fade-up">
              <div className="multimedia-featured-grid">
                <div className="multimedia-featured-video">
                  {featuredItem.youtubeId ? (
                    <iframe
                      src={youtubeEmbedUrl(featuredItem.youtubeId)}
                      title={featuredItem.title}
                      className="multimedia-iframe"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div
                      className="multimedia-featured-fallback"
                      style={{ background: featuredItem.bg }}
                    >
                      <span>{featuredItem.icon}</span>
                    </div>
                  )}
                </div>
                <div className="multimedia-featured-body">
                  <div className="multimedia-featured-tag">
                    ✦ Destacado · {featuredItem.type}
                  </div>
                  <h3>{featuredItem.title}</h3>
                  {featuredItem.author && (
                    <p className="multimedia-featured-author">
                      {featuredItem.author}
                    </p>
                  )}
                  {featuredItem.summary && (
                    <p className="multimedia-featured-summary">
                      {featuredItem.summary}
                    </p>
                  )}
                  {featuredItem.keyPoints && featuredItem.keyPoints.length > 0 && (
                    <ul className="multimedia-featured-points">
                      {featuredItem.keyPoints.map((point, idx) => (
                        <li key={idx}>{point}</li>
                      ))}
                    </ul>
                  )}
                  <div className="multimedia-featured-meta">
                    {featuredItem.date && <span>📅 {featuredItem.date}</span>}
                    {featuredItem.duration && <span>⏱ {featuredItem.duration}</span>}
                    {featuredItem.youtubeId && (
                      <a
                        href={`https://www.youtube.com/watch?v=${featuredItem.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="multimedia-featured-link"
                      >
                        Ver en YouTube ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Full grid ─── */}
        <section className="archive-grid-section">
          <div className="section-inner">
            <div className="section-header fade-up">
              <div className="section-label">Catálogo completo</div>
              <h2 className="section-title">Todos los contenidos</h2>
              <p className="section-desc">
                Ordinados del más reciente al más antiguo. Haz clic en cualquier
                video para reproducirlo aquí mismo.
              </p>
            </div>

            <div className="gallery-grid gallery-grid-archive fade-up">
              {allItems.map((item) => (
                <div
                  className="gallery-item"
                  key={item.id}
                  onClick={() => item.youtubeId && setActiveMedia(item)}
                  style={{ cursor: item.youtubeId ? 'pointer' : 'default' }}
                >
                  {item.youtubeId ? (
                    <>
                      <img
                        src={`https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`}
                        alt={item.title}
                        className="gallery-thumb"
                        loading="lazy"
                      />
                      <div className="gallery-overlay"></div>
                      {item.hasPlay && <div className="play-btn">▶</div>}
                      {item.duration && (
                        <span className="gallery-duration">{item.duration}</span>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="gallery-bg" style={{ background: item.bg }}>
                        {item.icon}
                      </div>
                      <div className="gallery-overlay"></div>
                      {item.hasPlay && <div className="play-btn">▶</div>}
                    </>
                  )}
                  <div className="gallery-info">
                    <div className="type">{item.type}</div>
                    <h4>{item.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ─── Modal ─── */}
      {activeMedia && activeMedia.youtubeId && (
        <div className="multimedia-modal" onClick={() => setActiveMedia(null)}>
          <div
            className="multimedia-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="multimedia-modal-close"
              onClick={() => setActiveMedia(null)}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <iframe
              src={youtubeEmbedUrl(activeMedia.youtubeId)}
              title={activeMedia.title}
              className="multimedia-iframe"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="multimedia-modal-info">
              <div className="type">{activeMedia.type}</div>
              <h4>{activeMedia.title}</h4>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </>
  );
}
