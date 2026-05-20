'use client';

import { useRef, useEffect } from 'react';

export default function About() {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ensure video plays on mobile
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const playVideo = async () => {
      try {
        await v.play();
      } catch {
        const resume = () => { v.play().catch(() => {}); };
        document.addEventListener('touchstart', resume, { once: true });
        document.addEventListener('click', resume, { once: true });
      }
    };
    playVideo();
  }, []);

  return (
    <section id="about">
      <div className="section-inner">
        <div className="about-grid">
          <div className="about-visual fade-up">
            <div className="about-3d-container">
              <video
                ref={videoRef}
                className="about-video"
                src="/about-animation.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              />
              <div className="about-video-mask"></div>
            </div>
            <div className="about-card-below">
              <div className="acb-label">Fundada en</div>
              <div className="acb-val">2023</div>
              <div className="acb-sub">Bajo la dirección del Ing. Juan Gomez</div>
            </div>
          </div>
          <div className="about-right fade-up">
            <div className="section-header">
              <div className="section-label">Sobre la Secretaría</div>
              <h2 className="section-title">Una institución para transformar el sector energético</h2>
              <p className="section-desc">
                La Secretaría de Energía de Fuerza del Pueblo es el organismo técnico-político responsable de formular, articular y difundir la visión energética del partido para la República Dominicana. Trabajamos con rigor académico, compromiso institucional y visión estratégica de largo plazo.
              </p>
            </div>
            <div className="mission-cards">
              <div className="mission-card">
                <div className="icon">🎯</div>
                <h4>Misión</h4>
                <p>Formular propuestas de política energética innovadoras, sostenibles y accesibles para todos los dominicanos.</p>
              </div>
              <div className="mission-card">
                <div className="icon">🔭</div>
                <h4>Visión</h4>
                <p>Una República Dominicana energéticamente soberana, limpia y competitiva para el año 2040.</p>
              </div>
              <div className="mission-card">
                <div className="icon">⚡</div>
                <h4>Objetivos estratégicos</h4>
                <p>Reducir pérdidas técnicas, democratizar el acceso, impulsar renovables y modernizar la infraestructura nacional.</p>
              </div>
              <div className="mission-card">
                <div className="icon">🏛️</div>
                <h4>Rol institucional</h4>
                <p>Somos el brazo técnico de Fuerza del Pueblo en materia energética, vinculando política y ciencia.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
