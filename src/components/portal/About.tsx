'use client';

import { useEffect, useRef } from 'react';

export default function About() {
  const aboutIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = aboutIframeRef.current;
    if (!iframe) return;

    function reveal() {
      if (iframe) iframe.style.opacity = '1';
    }

    const handleLoad = () => setTimeout(reveal, 700);
    iframe.addEventListener('load', handleLoad);

    const fallback = setTimeout(reveal, 5500);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <section id="about">
      <div className="section-inner">
        <div className="about-grid">
          <div className="about-visual fade-up">
            <div className="about-3d-container" style={{position:'relative',overflow:'hidden',borderRadius:24,aspectRatio:'1',background:'#0a2e19'}}>
              <iframe
                ref={aboutIframeRef}
                id="about-sketchfab-iframe"
                title="Power Storage Container Scene – Infraestructura energética"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                src="https://sketchfab.com/models/a15a78b13272455baf25af252102cd8f/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&ui_watermark=0&ui_watermark_link=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&preload=1&camera=0&transparent=0&dnt=1&autospin=0.25&scrollwheel=0&double_click=0&ui_theme=dark&shading=lit"
                style={{width:'100%',height:'100%',border:'none',position:'absolute',inset:0,opacity:0,transition:'opacity 1.2s ease 0.8s'}}
              ></iframe>
              <div style={{position:'absolute',inset:0,zIndex:2,pointerEvents:'none',background:'linear-gradient(to bottom, rgba(10,46,25,0.55) 0%, transparent 22%, transparent 78%, rgba(10,46,25,0.65) 100%), linear-gradient(to right, transparent 70%, rgba(244,246,244,0.18) 100%)'}}></div>
            </div>
            <div className="about-card-below">
              <div className="acb-label">Fundada en</div>
              <div className="acb-val">2023</div>
              <div className="acb-sub">Bajo la dirección del Ing. Leonel</div>
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
