'use client';

export default function Events() {
  const events = [
    { day: '16', mon: 'ENE', title: 'Foro Nacional: Transición Energética Justa en la República Dominicana', desc: 'Espacio de diálogo multisectorial para analizar los retos y oportunidades de la transición energética con enfoque en empleo, equidad y desarrollo regional.', tags: ['Foro', 'Presencial', '📍 Hotel Jaragua, Santo Domingo'] },
    { day: '22', mon: 'ENE', title: 'Conferencia: Almacenamiento de Energía y Redes Inteligentes', desc: 'Seminario técnico con expertos internacionales sobre baterías de gran escala, gestión de demanda y digitalización del sistema eléctrico.', tags: ['Conferencia', 'Híbrido', '📍 PUCMM, Santiago'] },
    { day: '28', mon: 'ENE', title: 'Rueda de prensa: Presentación del Informe de Pérdidas Eléctricas 2024', desc: 'La Secretaría presenta públicamente los resultados del estudio sobre pérdidas técnicas y no técnicas en el sistema de distribución nacional.', tags: ['Prensa', 'Virtual', '📍 Online · Zoom'] },
    { day: '05', mon: 'FEB', title: 'Cumbre Energética Fuerza del Pueblo 2025', desc: 'Evento anual de la Secretaría de Energía con la participación de técnicos, legisladores, empresarios y sociedad civil en un diálogo estratégico de alto nivel.', tags: ['Cumbre', 'Presencial', '📍 Centro de los Héroes, SD'], highlight: true },
  ];

  return (
    <section id="events">
      <div className="section-inner">
        <div className="section-header fade-up">
          <div className="section-label">Agenda institucional</div>
          <h2 className="section-title">Eventos y agenda</h2>
        </div>
        <div className="events-layout fade-up">
          <div>
            <div className="calendar-mini">
              <div className="cal-header">
                <button className="cal-nav">‹</button>
                <span className="cal-month">Enero 2025</span>
                <button className="cal-nav">›</button>
              </div>
              <div className="cal-grid">
                <div className="cal-day-head">L</div><div className="cal-day-head">M</div><div className="cal-day-head">X</div><div className="cal-day-head">J</div><div className="cal-day-head">V</div><div className="cal-day-head">S</div><div className="cal-day-head">D</div>
                <div className="cal-day other-month">30</div><div className="cal-day other-month">31</div><div className="cal-day">1</div><div className="cal-day">2</div><div className="cal-day">3</div><div className="cal-day">4</div><div className="cal-day">5</div>
                <div className="cal-day">6</div><div className="cal-day">7</div><div className="cal-day has-event">8</div><div className="cal-day">9</div><div className="cal-day">10</div><div className="cal-day">11</div><div className="cal-day">12</div>
                <div className="cal-day">13</div><div className="cal-day">14</div><div className="cal-day today">15</div><div className="cal-day has-event">16</div><div className="cal-day">17</div><div className="cal-day">18</div><div className="cal-day">19</div>
                <div className="cal-day">20</div><div className="cal-day">21</div><div className="cal-day has-event">22</div><div className="cal-day">23</div><div className="cal-day">24</div><div className="cal-day">25</div><div className="cal-day">26</div>
                <div className="cal-day">27</div><div className="cal-day has-event">28</div><div className="cal-day">29</div><div className="cal-day">30</div><div className="cal-day">31</div><div className="cal-day other-month">1</div><div className="cal-day other-month">2</div>
              </div>
            </div>
          </div>
          <div className="events-list">
            {events.map((ev, i) => (
              <div className="event-card" key={i}>
                <div className="event-date-badge" style={ev.highlight ? {background:'var(--green-accent)'} : undefined}>
                  <div className="day">{ev.day}</div>
                  <div className="mon">{ev.mon}</div>
                </div>
                <div className="event-body">
                  <h4>{ev.title}</h4>
                  <p>{ev.desc}</p>
                  <div className="event-tags">
                    {ev.tags.map((tag, j) => (
                      <span className={`event-tag ${tag.startsWith('📍') ? 'loc' : ''}`} key={j}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
