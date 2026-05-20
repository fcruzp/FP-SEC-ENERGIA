'use client';

import { useEffect, useRef, useCallback } from 'react';

const TOTAL_FRAMES = 250;
const FPS = 30;
const FRAME_INTERVAL = 1000 / FPS;

// Pre-generate frame URLs
const frameUrls = Array.from({ length: TOTAL_FRAMES }, (_, i) => `/hero-frames/${String(i + 1).padStart(4, '0')}.webp`);

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const currentFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const animIdRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  // Draw a frame on canvas with cover-fit
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[frameIndex];
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    const displayW = canvas.offsetWidth;
    const displayH = canvas.offsetHeight;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;

    const canvasAspect = canvas.width / canvas.height;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

    if (imgAspect > canvasAspect) {
      sw = img.naturalHeight * canvasAspect;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / canvasAspect;
      sy = (img.naturalHeight - sh) / 2;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  }, []);

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!isPlayingRef.current) return;

    if (timestamp - lastTimeRef.current >= FRAME_INTERVAL) {
      lastTimeRef.current = timestamp;
      currentFrameRef.current = (currentFrameRef.current + 1) % TOTAL_FRAMES;
      drawFrame(currentFrameRef.current);
    }

    animIdRef.current = requestAnimationFrame(animate);
  }, [drawFrame]);

  // Preload frames and start animation
  useEffect(() => {
    let loaded = 0;

    const onFrameLoad = (index: number) => {
      loaded++;
      // Draw first frame immediately
      if (index === 0) {
        drawFrame(0);
      }
      // Start animation once enough frames are buffered
      if (loaded >= 30 && !isPlayingRef.current) {
        isPlayingRef.current = true;
        lastTimeRef.current = performance.now();
        animIdRef.current = requestAnimationFrame(animate);
      }
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = frameUrls[i];
      img.onload = () => onFrameLoad(i);
      framesRef.current[i] = img;
    }

    // Handle resize
    const handleResize = () => {
      if (framesRef.current[currentFrameRef.current]?.complete) {
        drawFrame(currentFrameRef.current);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isPlayingRef.current = false;
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [animate, drawFrame]);

  return (
    <section id="hero">
      <div className="hero-overlay"></div>

      {/* 3D Model rotation — WebP frame sequence */}
      <div className="hero-model-wrap">
        <canvas ref={canvasRef} id="hero-model-canvas"></canvas>
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
