'use client';

import { useEffect, useRef } from 'react';

export default function Observatory() {
  const donutCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartBarsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Donut chart
  useEffect(() => {
    const canvas = donutCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const slices = [
      { pct: 0.56, color: '#1a6b3c' },
      { pct: 0.16, color: '#3db870' },
      { pct: 0.14, color: '#4ade80' },
      { pct: 0.08, color: '#06b6d4' },
      { pct: 0.06, color: '#0e7490' }
    ];
    const cx = 70, cy = 70, r = 55, inner = 36;
    let angle = -Math.PI / 2;

    ctx.clearRect(0, 0, 140, 140);
    slices.forEach(s => {
      const end = angle + s.pct * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, end);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      angle = end;
    });

    // Inner circle (donut hole)
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');

          // Animate counters
          e.target.querySelectorAll('.counter').forEach(el => {
            const target = parseFloat((el as HTMLElement).dataset.val || '0');
            if ((el as HTMLElement).dataset.animated) return;
            (el as HTMLElement).dataset.animated = '1';
            const isFloat = String(target).includes('.');
            const duration = 1500;
            const start = performance.now();
            function update(now: number) {
              const progress = Math.min((now - start) / duration, 1);
              const ease = 1 - Math.pow(1 - progress, 3);
              const val = target * ease;
              el.textContent = isFloat ? val.toFixed(1) : Math.floor(val).toLocaleString();
              if (progress < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
          });

          // Trigger hero stat counters
          e.target.querySelectorAll('[data-count]').forEach(el => {
            if ((el as HTMLElement).dataset.animated) return;
            (el as HTMLElement).dataset.animated = '1';
            const target = parseInt((el as HTMLElement).dataset.count || '0');
            const duration = 2000;
            const start = performance.now();
            function update(now: number) {
              const p = Math.min((now - start) / duration, 1);
              el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
              if (p < 1) requestAnimationFrame(update);
            }
            requestAnimationFrame(update);
          });

          // Trigger KPI bars
          e.target.querySelectorAll('.kpi-bar-fill').forEach(el => {
            (el as HTMLElement).style.width = (el as HTMLElement).dataset.pct + '%';
          });

          // Trigger chart bars
          if (e.target.querySelector('.chart-bar')) {
            document.querySelectorAll('.chart-bar').forEach(bar => {
              setTimeout(() => { (bar as HTMLElement).style.height = (bar as HTMLElement).dataset.h; }, 200);
            });
          }
        }
      });
    }, { threshold: 0.1 });

    section.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // Stagger delays
    section.querySelectorAll('.fade-up').forEach((el, i) => {
      (el as HTMLElement).style.transitionDelay = (i % 4) * 0.08 + 's';
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="observatory" ref={sectionRef}>
      <div className="section-inner">
        <div className="section-header fade-up">
          <div className="section-label">Panel de datos</div>
          <h2 className="section-title">Observatorio Energético</h2>
          <p className="section-desc">Monitoreo en tiempo real de los indicadores clave del sector eléctrico dominicano.</p>
        </div>
        <div className="obs-grid">
          <div className="kpi-card fade-up">
            <div className="kpi-header">
              <div className="kpi-icon">📉</div>
              <span className="kpi-badge down">↑ +2.3%</span>
            </div>
            <div className="kpi-val"><span className="counter" data-val="40.2">0</span>%</div>
            <div className="kpi-label">Pérdidas eléctricas</div>
            <div className="kpi-bar"><div className="kpi-bar-fill" data-pct="40"></div></div>
          </div>
          <div className="kpi-card featured fade-up">
            <div className="kpi-header">
              <div className="kpi-icon">🌱</div>
              <span className="kpi-badge up">↑ +6.1%</span>
            </div>
            <div className="kpi-val"><span className="counter" data-val="28.4">0</span>%</div>
            <div className="kpi-label">Generación renovable</div>
            <div className="kpi-bar"><div className="kpi-bar-fill" data-pct="28"></div></div>
          </div>
          <div className="kpi-card fade-up">
            <div className="kpi-header">
              <div className="kpi-icon">⚡</div>
              <span className="kpi-badge neu">→ Estable</span>
            </div>
            <div className="kpi-val"><span className="counter" data-val="3850">0</span> MW</div>
            <div className="kpi-label">Demanda energética (pico)</div>
            <div className="kpi-bar"><div className="kpi-bar-fill" data-pct="65"></div></div>
          </div>
          <div className="kpi-card fade-up">
            <div className="kpi-header">
              <div className="kpi-icon">💲</div>
              <span className="kpi-badge down">↑ +4.7%</span>
            </div>
            <div className="kpi-val">RD$<span className="counter" data-val="14.8">0</span></div>
            <div className="kpi-label">Costo promedio kWh</div>
            <div className="kpi-bar"><div className="kpi-bar-fill" data-pct="55"></div></div>
          </div>
          <div className="kpi-card fade-up">
            <div className="kpi-header">
              <div className="kpi-icon">🏭</div>
              <span className="kpi-badge up">↑ +3.2%</span>
            </div>
            <div className="kpi-val"><span className="counter" data-val="4218">0</span> MW</div>
            <div className="kpi-label">Capacidad instalada</div>
            <div className="kpi-bar"><div className="kpi-bar-fill" data-pct="72"></div></div>
          </div>
          <div className="kpi-card fade-up">
            <div className="kpi-header">
              <div className="kpi-icon">🏠</div>
              <span className="kpi-badge up">↑ +1.8%</span>
            </div>
            <div className="kpi-val"><span className="counter" data-val="87.3">0</span>%</div>
            <div className="kpi-label">Cobertura energética</div>
            <div className="kpi-bar"><div className="kpi-bar-fill" data-pct="87"></div></div>
          </div>
        </div>
        <div className="obs-bottom fade-up">
          <div className="chart-card">
            <h3>Generación por fuente (GWh) — 2024</h3>
            <div className="chart-bars" ref={chartBarsRef}>
              <div className="chart-bar-col"><div className="chart-bar" style={{height:0}} data-h="85%" title="Térmica: 8,200 GWh"></div><div className="chart-bar-lbl">Térmica</div></div>
              <div className="chart-bar-col"><div className="chart-bar alt" style={{height:0}} data-h="30%" title="Solar: 2,900 GWh"></div><div className="chart-bar-lbl">Solar</div></div>
              <div className="chart-bar-col"><div className="chart-bar alt" style={{height:0}} data-h="20%" title="Eólica: 1,900 GWh"></div><div className="chart-bar-lbl">Eólica</div></div>
              <div className="chart-bar-col"><div className="chart-bar alt" style={{height:0}} data-h="18%" title="Hidro: 1,740 GWh"></div><div className="chart-bar-lbl">Hidro</div></div>
              <div className="chart-bar-col"><div className="chart-bar" style={{height:0}} data-h="60%" title="GNL: 5,800 GWh"></div><div className="chart-bar-lbl">GNL</div></div>
              <div className="chart-bar-col"><div className="chart-bar alt" style={{height:0}} data-h="8%" title="Biomasa: 770 GWh"></div><div className="chart-bar-lbl">Biomasa</div></div>
            </div>
          </div>
          <div className="donut-card">
            <h3>Mix energético</h3>
            <div className="donut-wrap">
              <canvas ref={donutCanvasRef} width="140" height="140"></canvas>
              <div className="donut-center"><div className="val">100%</div><div className="lbl">Total</div></div>
            </div>
            <div className="donut-legend">
              <div className="legend-item"><span className="legend-dot" style={{background:'#1a6b3c'}}></span><span className="legend-label">Térmica</span><span className="legend-pct">56%</span></div>
              <div className="legend-item"><span className="legend-dot" style={{background:'#3db870'}}></span><span className="legend-label">GNL</span><span className="legend-pct">16%</span></div>
              <div className="legend-item"><span className="legend-dot" style={{background:'#4ade80'}}></span><span className="legend-label">Solar</span><span className="legend-pct">14%</span></div>
              <div className="legend-item"><span className="legend-dot" style={{background:'#06b6d4'}}></span><span className="legend-label">Eólica</span><span className="legend-pct">8%</span></div>
              <div className="legend-item"><span className="legend-dot" style={{background:'#0e7490'}}></span><span className="legend-label">Hidro</span><span className="legend-pct">6%</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
