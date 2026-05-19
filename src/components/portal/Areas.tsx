'use client';

export default function Areas() {
  const areas = [
    { num: '01', icon: '⚡', title: 'Sistema eléctrico', desc: 'Modernización integral de la red de transmisión y distribución con tecnologías de red inteligente.', img: '/areas/area-01-electric.jpg' },
    { num: '02', icon: '🌱', title: 'Energías renovables', desc: 'Plan nacional de expansión solar, eólica, hidroeléctrica y de biogás con metas claras al 2035.', img: '/areas/area-02-renovables.jpg' },
    { num: '03', icon: '💰', title: 'Tarifas eléctricas', desc: 'Reforma tarifaria que protege al consumidor residencial y garantiza la viabilidad financiera del sector.', img: '/areas/area-03-tarifas.jpg' },
    { num: '04', icon: '🛡️', title: 'Seguridad energética', desc: 'Diversificación de fuentes y reducción de la dependencia de combustibles fósiles importados.', img: '/areas/area-04-seguridad.jpg' },
    { num: '05', icon: '🏗️', title: 'Infraestructura energética', desc: 'Inversión estratégica en subestaciones, líneas de transmisión y terminales de GNL.', img: '/areas/area-05-infraestructura.jpg' },
    { num: '06', icon: '🌍', title: 'Sostenibilidad', desc: 'Alineación con el Acuerdo de París y los Objetivos de Desarrollo Sostenible de la ONU.', img: '/areas/area-06-sostenibilidad.jpg' },
    { num: '07', icon: '📉', title: 'Pérdidas eléctricas', desc: 'Estrategia integral para reducir las pérdidas técnicas y no técnicas al 15% en cinco años.', img: '/areas/area-07-perdidas.jpg' },
    { num: '08', icon: '🔬', title: 'Innovación energética', desc: 'Fomento de I+D, startups energéticas y alianzas con universidades nacionales e internacionales.', img: '/areas/area-08-innovacion.jpg' },
    { num: '09', icon: '📊', title: 'Planificación estratégica', desc: 'Plan Decenal de Energía con horizonte al 2035 basado en datos, modelos y consenso sectorial.', img: '/areas/area-09-planificacion.jpg' },
    { num: '10', icon: '🔄', title: 'Transición energética', desc: 'Hoja de ruta hacia una economía baja en carbono que preserve empleos y dinamice el desarrollo.', img: '/areas/area-10-transicion.jpg' },
  ];

  return (
    <section id="areas">
      <div className="section-inner">
        <div className="section-header fade-up">
          <div className="section-label">Líneas estratégicas</div>
          <h2 className="section-title">Líneas de acción</h2>
          <p className="section-desc">Diez ejes que articulan nuestra agenda de transformación del sector eléctrico y energético nacional.</p>
        </div>
        <div className="areas-grid">
          {areas.map((a, i) => (
            <div className="area-card fade-up" key={i}>
              <img className="area-card-bg" src={a.img} alt={a.title} />
              <div className="area-card-overlay"></div>
              <div className="area-card-content">
                <div className="num">{a.num}</div>
                <div className="icon">{a.icon}</div>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </div>
              <div className="arrow">→</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
