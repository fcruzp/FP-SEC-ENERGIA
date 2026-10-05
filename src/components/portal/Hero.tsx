'use client';

import { Fragment, useRef, useEffect, useState } from 'react';
import { editionFromSourceFile } from '@/lib/sources';

interface HeadlineStat {
  key: string;
  label: string;
  value: number;
  unit: string;
}

const HERO_LABELS: Record<string, string> = {
  perdidas: '% Pérdidas EDEs',
  cri: '% CRI EDEs',
  cobranzas: '% Cobranza EDEs',
  renovable: '% Generación renovable',
};

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stats, setStats] = useState<HeadlineStat[]>([]);
  const [edition, setEdition] = useState<string | null>(null);

  // Indicadores reales del Observatorio (fuente: MEM)
  useEffect(() => {
    fetch('/api/observatorio/headline')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!json) return;
        setStats(json.stats ?? []);
        setEdition(editionFromSourceFile(json.source_file));
      })
      .catch(() => {});
  }, []);

  // Ensure video plays (some mobile browsers need a nudge)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const playVideo = async () => {
      try {
        await v.play();
      } catch {
        // Autoplay may be blocked — try again on user interaction
        const resume = () => { v.play().catch(() => {}); };
        document.addEventListener('touchstart', resume, { once: true });
        document.addEventListener('click', resume, { once: true });
      }
    };
    playVideo();
  }, []);

  return (
    <section id="hero">
      <div className="hero-overlay"></div>

      {/* 3D Model rotation — WebM video (official version) */}
      <div className="hero-model-wrap">
        <video
          ref={videoRef}
          className="hero-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src="/hero-animation.webm" type="video/webm" />
        </video>
        <div className="hero-model-mask"></div>
        <div className="hero-model-glow"></div>
      </div>

      <div className="hero-content">
        <div className="hero-badge fade-up"><span className="dot"></span>Fuerza del Pueblo · Secretaría de Energía</div>
        <h1 className="hero-title fade-up">
          Secretaría de<br/><span className="accent">Energía</span>
        </h1>
        <p className="hero-subtitle fade-up">
          Propuestas, análisis y visión estratégica para el futuro energético de la República Dominicana.
        </p>
        <div className="hero-actions fade-up">
          <a href="#areas" className="btn btn-primary btn-large">Ver propuestas</a>
          <a href="#news" className="btn btn-ghost btn-large">Leer comunicados</a>
        </div>
        {stats.length > 0 && (
          <>
            <div className="hero-stats">
              {stats.map((s, i) => (
                <Fragment key={s.key}>
                  {i > 0 && <div className="hero-divider"></div>}
                  <div className="hero-stat">
                    <div className="val">{s.value.toLocaleString('es-DO', { maximumFractionDigits: 1 })}</div>
                    <div className="lbl">{HERO_LABELS[s.key] ?? s.label}</div>
                  </div>
                </Fragment>
              ))}
            </div>
            <p className="hero-source">
              Fuente: Ministerio de Energía y Minas{edition ? `, Informe de Desempeño ${edition}` : ''}.{' '}
              <a href="/observatorio">Ver Observatorio →</a>
            </p>
          </>
        )}
      </div>

      <div className="scroll-indicator">
        <div className="scroll-line"></div>
        <span className="scroll-text">Scroll</span>
      </div>
    </section>
  );
}
