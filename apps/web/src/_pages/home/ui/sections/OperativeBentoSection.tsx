import type { CSSProperties } from 'react';
import { StockDemo } from '../StockDemo';
import { staggerStyle } from './LandingShared';

export function OperativeBentoSection() {
  const pillars = [
    {
      title: 'Menos tiempo persiguiendo datos',
      body: 'Consulta ingredientes y platos en una única superficie limpia, sin saltar entre libretas y hojas de cálculo.',
      badge: 'Disponible hoy',
      tone: 'green',
    },
    {
      title: 'Claridad sobre cada margen',
      body: 'Visualiza cómo impacta cada subida de proveedor en el coste por ración antes de que afecte a tu rentabilidad.',
      badge: 'Próximamente',
      tone: 'blue',
    },
    {
      title: 'Menos mermas por sorpresa',
      body: 'Detecta existencias bajas a tiempo hoy y prepara tu cocina para el descuento automático por venta.',
      badge: 'En evolución',
      tone: 'amber',
    },
  ] as const;

  return (
    <section className="landing-section bento-section" id="demo" aria-labelledby="sale-title">
      <div className="landing-shell">
        <div className="section-header" data-reveal="up">
          <h2>Datos pensados para el ritmo real del servicio.</h2>
          <p>
            Prueba la simulación de descuento por venta y descubre cómo se integrarán las métricas
            de cocina en una sola vista operativa.
          </p>
        </div>

        <div className="operative-bento-grid">
          <StockDemo />

          <div className="bento-card dashboard-bento-card" data-reveal="right">
            <div className="bento-card-top">
              <div>
                <h3>Resumen operativo de la semana</h3>
                <p>Indicadores clave para decidir compras y revisar márgenes de carta.</p>
              </div>
              <span className="landing-badge landing-badge-blue">Próximamente</span>
            </div>

            <div className="dashboard-stats">
              {[
                ['Ventas del día', '1.284 €'],
                ['Food cost medio', '27,4 %'],
                ['Margen bruto', '72,6 %'],
              ].map(([label, val], index) => (
                <div className="stagger-item" style={staggerStyle(index)} key={label}>
                  <small>{label}</small>
                  <strong>{val}</strong>
                </div>
              ))}
            </div>

            <div className="dashboard-lower">
              <div className="dashboard-chart-box">
                <div className="dashboard-chart-head">
                  <small>Actividad semanal en cocina</small>
                  <span>Lun a Dom</span>
                </div>
                <div
                  className="dashboard-chart"
                  aria-label="Gráfico ilustrativo de actividad semanal"
                >
                  {[38, 58, 47, 78, 66, 92, 72].map((height, index) => (
                    <span
                      key={index}
                      style={{ height: `${height}%`, '--stagger': index } as CSSProperties}
                    />
                  ))}
                </div>
                <div className="dashboard-days">
                  <span>L</span>
                  <span>M</span>
                  <span>X</span>
                  <span>J</span>
                  <span>V</span>
                  <span>S</span>
                  <span>D</span>
                </div>
              </div>

              <div className="dashboard-alerts-box">
                <small>Atención prioritaria</small>
                <div className="dashboard-alert-pill">
                  <strong>03</strong>
                  <span>ingredientes con stock bajo</span>
                </div>
                <div className="dashboard-alert-pill">
                  <strong>02</strong>
                  <span>platos por revisar coste</span>
                </div>
              </div>
            </div>
          </div>

          {pillars.map(({ title, body, badge, tone }, index) => (
            <div
              className="bento-card bento-pillar-card stagger-item"
              data-reveal="up"
              style={staggerStyle(index)}
              key={title}
            >
              <span className={`landing-badge landing-badge-${tone}`}>{badge}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
