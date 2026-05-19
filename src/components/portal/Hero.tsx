'use client';

import { useEffect, useRef } from 'react';

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Three.js scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof (window as any).THREE === 'undefined') return;

    const THREE = (window as any).THREE;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
    camera.position.set(0, 0, 28);

    // Grid
    const gridGeo = new THREE.BufferGeometry();
    const gridVerts: number[] = [];
    const SIZE = 40, STEP = 3;
    for (let i = -SIZE; i <= SIZE; i += STEP) {
      gridVerts.push(-SIZE, 0, i, SIZE, 0, i);
      gridVerts.push(i, 0, -SIZE, i, 0, SIZE);
    }
    gridGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(gridVerts), 3));
    const gridMat = new THREE.LineBasicMaterial({ color: 0x1a6b3c, transparent: true, opacity: 0.18 });
    const grid = new THREE.LineSegments(gridGeo, gridMat);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -8;
    scene.add(grid);

    // Floating nodes
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x3db870, transparent: true, opacity: 0.85 });
    const nodes: any[] = [];
    for (let i = 0; i < 32; i++) {
      const geo = new THREE.SphereGeometry(0.12 + Math.random() * 0.18, 8, 8);
      const m = new THREE.Mesh(geo, nodeMat.clone());
      m.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 14 - 4
      );
      m.userData = {
        ox: m.position.x, oy: m.position.y, oz: m.position.z,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2
      };
      scene.add(m);
      nodes.push(m);
    }

    // Connection lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0x2d9e5f, transparent: true, opacity: 0.25 });
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].position.distanceTo(nodes[j].position);
        if (d < 10) {
          const lg = new THREE.BufferGeometry().setFromPoints([nodes[i].position, nodes[j].position]);
          scene.add(new THREE.Line(lg, lineMat));
        }
      }
    }

    // Particles
    const partGeo = new THREE.BufferGeometry();
    const pCount = 300;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 60;
    partGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const partMat = new THREE.PointsMaterial({ color: 0x4ade80, size: 0.08, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(partGeo, partMat);
    scene.add(particles);

    // Rings
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(6, 0.04, 8, 60),
      new THREE.MeshBasicMaterial({ color: 0x1a6b3c, transparent: true, opacity: 0.3 })
    );
    ring1.rotation.x = Math.PI / 3;
    ring1.position.set(8, 0, -6);
    scene.add(ring1);

    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(4, 0.03, 8, 60),
      new THREE.MeshBasicMaterial({ color: 0x3db870, transparent: true, opacity: 0.2 })
    );
    ring2.rotation.x = -Math.PI / 4;
    ring2.position.set(-6, 2, -4);
    scene.add(ring2);

    // Mouse parallax
    let mx = 0, my = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let t = 0;
    let animId: number;
    function animate() {
      animId = requestAnimationFrame(animate);
      t += 0.008;
      nodes.forEach(n => {
        n.position.y = n.userData.oy + Math.sin(t * n.userData.speed + n.userData.phase) * 1.2;
        n.position.x = n.userData.ox + Math.cos(t * n.userData.speed * 0.7 + n.userData.phase) * 0.5;
      });
      particles.rotation.y = t * 0.03;
      particles.rotation.x = t * 0.01;
      ring1.rotation.z = t * 0.4;
      ring2.rotation.z = -t * 0.3;
      grid.rotation.z = t * 0.015;
      camera.position.x += (mx * 2 - camera.position.x) * 0.03;
      camera.position.y += (-my * 1.5 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    const handleResize = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Sketchfab iframe fade-in
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setTimeout(() => {
        iframe.classList.add('loaded');
      }, 600);
    };

    iframe.addEventListener('load', handleLoad);

    // Fallback after 5s
    const fallback = setTimeout(() => {
      iframe.classList.add('loaded');
    }, 5000);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      clearTimeout(fallback);
    };
  }, []);

  return (
    <section id="hero">
      <canvas ref={canvasRef} id="hero-canvas"></canvas>
      <div className="hero-overlay"></div>

      {/* Sketchfab Thermal Power Plant 3D Model */}
      <div className="hero-model-wrap">
        <iframe
          ref={iframeRef}
          id="sketchfab-iframe"
          title="Thermal Power Plant – Infraestructura energética"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          src="https://sketchfab.com/models/b6cdd73f754a4d739ed40da287038e40/embed?autostart=1&ui_infos=0&ui_controls=0&ui_stop=0&ui_watermark=0&ui_watermark_link=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&preload=1&camera=0&transparent=0&dnt=1&autospin=0.3&scrollwheel=0&double_click=0&ui_theme=dark&background=000000&shading=lit&annotations_visible=0&orbit_constraint_zoom_in=2&orbit_constraint_zoom_out=8"
        ></iframe>
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
