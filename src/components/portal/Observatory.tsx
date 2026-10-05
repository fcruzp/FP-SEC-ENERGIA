'use client';

import { useEffect, useRef, useState } from 'react';
import { formatDateOnly } from '@/lib/dates';
import { editionFromSourceFile } from '@/lib/sources';

interface HeadlineStat {
  key: string;
  label: string;
  value: number;
  date: string;
  previous_year_value: number | null;
}

interface Generation {
  from: string;
  to: string;
  sources: { label: string; gwh: number; renewable: boolean }[];
}

interface Headline {
  stats: HeadlineStat[];
  generation: Generation | null;
  source_file: string | null;
}

/** Icono y sentido "bueno" de cada indicador (sube = mejora, salvo pérdidas). */
const STAT_META: Record<string, { icon: string; goodWhenUp: boolean }> = {
  perdidas: { icon: '📉', goodWhenUp: false },
  cri: { icon: '🔁', goodWhenUp: true },
  cobranzas: { icon: '💲', goodWhenUp: true },
  renovable: { icon: '🌱', goodWhenUp: true },
};

const SOURCE_COLORS = ['#1a6b3c', '#0f3d22', '#3db870', '#4ade80', '#06b6d4', '#0e7490', '#a3e635'];

const fmt = (n: number, digits = 1) => n.toLocaleString('es-DO', { maximumFractionDigits: digits, minimumFractionDigits: digits });

function changeBadge(stat: HeadlineStat) {
  if (stat.previous_year_value === null) return null;
  const diff = stat.value - stat.previous_year_value;
  const meta = STAT_META[stat.key];
  if (Math.abs(diff) < 0.05) return { cls: 'neu', text: '→ Sin cambio' };
  const improved = meta ? (diff > 0) === meta.goodWhenUp : diff > 0;
  return {
    cls: improved ? 'up' : 'down',
    text: `${diff > 0 ? '↑ +' : '↓ '}${fmt(diff)} pp`,
  };
}

export default function Observatory() {
  const donutCanvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<Headline | null>(null);

  useEffect(() => {
    fetch('/api/observatorio/headline')
      .then(res => (res.ok ? res.json() : null))
      .then(json => { if (json) setData(json); })
      .catch(() => {});
  }, []);

  const generation = data?.generation ?? null;
  const totalGwh = generation?.sources.reduce((sum, s) => sum + s.gwh, 0) ?? 0;
  const renewableGwh = generation?.sources.filter(s => s.renewable).reduce((sum, s) => sum + s.gwh, 0) ?? 0;
  const maxGwh = generation ? Math.max(...generation.sources.map(s => s.gwh)) : 0;
  const latestDate = data?.stats[0]?.date;
  const edition = editionFromSourceFile(data?.source_file);

  // Donut: participación de cada fuente en la generación de los últimos 12 meses
  useEffect(() => {
    const canvas = donutCanvasRef.current;
    if (!canvas || !generation || totalGwh === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cx = 70, cy = 70, r = 55, inner = 36;
    let angle = -Math.PI / 2;
    ctx.clearRect(0, 0, 140, 140);
    generation.sources.forEach((s, i) => {
      const end = angle + (s.gwh / totalGwh) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, end);
      ctx.closePath();
      ctx.fillStyle = SOURCE_COLORS[i % SOURCE_COLORS.length];
      ctx.fill();
      angle = end;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }, [generation, totalGwh]);

  const periodLabel = generation
    ? `${formatDateOnly(generation.from, { month: 'short', year: 'numeric' })} – ${formatDateOnly(generation.to, { month: 'short', year: 'numeric' })}`
    : '';

  return (
    <section id="observatory">
      <div className="section-inner">
        <div className="section-header fade-up">
          <div className="section-label">Panel de datos</div>
          <h2 className="section-title">Observatorio Energético</h2>
          <p className="section-desc">
            Indicadores clave del sector eléctrico dominicano a partir de datos oficiales
            {latestDate ? ` · Datos a ${formatDateOnly(latestDate, { month: 'long', year: 'numeric' })}` : ''}.
          </p>
        </div>

        {data && (
          <>
            <div className="obs-grid">
              {data.stats.map(stat => {
                const badge = changeBadge(stat);
                return (
                  <div className="kpi-card" key={stat.key}>
                    <div className="kpi-header">
                      <div className="kpi-icon" aria-hidden="true">{STAT_META[stat.key]?.icon ?? '📊'}</div>
                      {badge && <span className={`kpi-badge ${badge.cls}`} title="Variación interanual (puntos porcentuales)">{badge.text}</span>}
                    </div>
                    <div className="kpi-val">{fmt(stat.value)}%</div>
                    <div className="kpi-label">{stat.label}</div>
                    <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${Math.min(stat.value, 100)}%` }}></div></div>
                  </div>
                );
              })}
              {generation && (
                <>
                  <div className="kpi-card featured">
                    <div className="kpi-header">
                      <div className="kpi-icon" aria-hidden="true">⚡</div>
                      <span className="kpi-badge neu">12 meses</span>
                    </div>
                    <div className="kpi-val">{fmt(totalGwh, 0)} GWh</div>
                    <div className="kpi-label">Generación total ({periodLabel})</div>
                    <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: '100%' }}></div></div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-header">
                      <div className="kpi-icon" aria-hidden="true">☀️</div>
                      <span className="kpi-badge neu">12 meses</span>
                    </div>
                    <div className="kpi-val">{fmt((renewableGwh / totalGwh) * 100)}%</div>
                    <div className="kpi-label">Participación renovable ({periodLabel})</div>
                    <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${(renewableGwh / totalGwh) * 100}%` }}></div></div>
                  </div>
                </>
              )}
            </div>

            {generation && (
              <div className="obs-bottom">
                <div className="chart-card">
                  <h3>Generación por fuente (GWh) — {periodLabel}</h3>
                  <div className="chart-bars">
                    {generation.sources.map(s => (
                      <div className="chart-bar-col" key={s.label}>
                        <div
                          className={`chart-bar${s.renewable ? ' alt' : ''}`}
                          style={{ height: `${(s.gwh / maxGwh) * 100}%` }}
                          title={`${s.label}: ${fmt(s.gwh, 0)} GWh`}
                        ></div>
                        <div className="chart-bar-lbl">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="donut-card">
                  <h3>Mix de generación</h3>
                  <div className="donut-wrap">
                    <canvas ref={donutCanvasRef} width="140" height="140" aria-label="Participación de cada fuente en la generación"></canvas>
                    <div className="donut-center"><div className="val">{fmt((renewableGwh / totalGwh) * 100, 0)}%</div><div className="lbl">Renovable</div></div>
                  </div>
                  <div className="donut-legend">
                    {generation.sources.map((s, i) => (
                      <div className="legend-item" key={s.label}>
                        <span className="legend-dot" style={{ background: SOURCE_COLORS[i % SOURCE_COLORS.length] }}></span>
                        <span className="legend-label">{s.label}</span>
                        <span className="legend-pct">{fmt((s.gwh / totalGwh) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <p className="obs-source">
              Fuente: Ministerio de Energía y Minas (MEM), <em>Informe de Desempeño de las Empresas Eléctricas Estatales</em>
              {edition ? `, edición ${edition}` : ''}.{' '}
              <a href="/observatorio">Explorar el Observatorio completo →</a>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
