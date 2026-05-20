'use client';

import { useRef, useEffect } from 'react';

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

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

      {/* 3D Model rotation — MP4 video */}
      <div className="hero-model-wrap">
        <video
          ref={videoRef}
          className="hero-video"
          src="/hero-animation.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        />
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
        <div className="hero-stats">
          <div className="hero-stat fade-up"><div className="val" data-count="40">0</div><div className="lbl">% Pérdidas eléctricas</div></div>
          <div className="hero-divider"></div>
          <div className="hero-stat fade-up"><div className="val" data-count="4200">0</div><div className="lbl">MW Capacidad instalada</div></div>
          <div className="hero-divider"></div>
          <div className="hero-stat fade-up"><div className="val" data-count="28">0</div><div className="lbl">% Energía renovable</div></div>
          <div className="hero-divider"></div>
          <div className="hero-stat fade-up"><div className="val" data-count="12">0</div><div className="lbl">Propuestas de ley</div></div>
        </div>
      </div>

      <div className="scroll-indicator">
        <div className="scroll-line"></div>
        <span className="scroll-text">Scroll</span>
      </div>
    </section>
  );
}
