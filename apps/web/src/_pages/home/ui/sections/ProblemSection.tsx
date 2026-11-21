import { MinusSignIcon, PlusSignIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { Icon, staggerStyle } from './LandingShared';

export function ProblemSection() {
  const beforeItems = [
    'Hojas de cálculo dispersas entre compras y cocina',
    'Inventario manual sin avisos claros de stock bajo',
    'Precios de proveedor desactualizados en las recetas',
    'Márgenes calculados tarde, cuando el mes ya cerró',
  ];

  const afterItems = [
    [Tick02Icon, 'Ingredientes y platos centralizados en una sola vista', 'Disponible'],
    [Tick02Icon, 'Existencias y unidades legibles al instante en almacén', 'Disponible'],
    [PlusSignIcon, 'Escandallos conectados al precio de cada ingrediente', 'Disponible'],
    [PlusSignIcon, 'Descuento automático de stock desde cada venta', 'Próximamente'],
  ] as const;

  return (
    <section className="landing-section problem-section" id="problema">
      <div className="landing-shell">
        <div className="section-header" data-reveal="up">
          <h2>Tu cocina no debería depender de hojas sueltas.</h2>
          <p>
            Cuando el stock, las compras y las recetas viven en archivos separados, cada servicio
            empieza con dudas sobre qué queda en almacén y cuánto cuesta realmente cada plato.
          </p>
        </div>
        <div className="problem-bento">
          <div className="compare-card compare-card-muted" data-reveal="left">
            <div className="compare-card-top">
              <strong>Sin un registro unificado</strong>
              <span className="landing-badge landing-badge-red">Fricción diaria</span>
            </div>
            <ul className="compare-list">
              {beforeItems.map((text, index) => (
                <li className="stagger-item" style={staggerStyle(index)} key={text}>
                  <span className="compare-icon compare-icon-muted">
                    <Icon icon={MinusSignIcon} size={15} />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="problem-question-pills">
              <span>«¿Cuánto stock queda hoy?»</span>
              <span>«¿Subió el coste de este plato?»</span>
              <span>«¿Dónde se estrecha el margen?»</span>
            </div>
          </div>

          <div className="compare-card compare-card-active" data-reveal="right">
            <div className="compare-card-top">
              <strong>Con el sistema de CocinaOS</strong>
              <span className="landing-badge landing-badge-green">Registro claro</span>
            </div>
            <ul className="compare-list">
              {afterItems.map(([ItemIcon, text, state], index) => (
                <li className="stagger-item" style={staggerStyle(index)} key={text}>
                  <span className="compare-icon compare-icon-active">
                    <Icon icon={ItemIcon} size={15} />
                  </span>
                  <div className="compare-item-body">
                    <span>{text}</span>
                    <small
                      className={state === 'Disponible' ? 'text-badge-green' : 'text-badge-blue'}
                    >
                      {state}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
            <div className="problem-question-pills">
              <span>«Descuenta todo solo»</span>
              <span>«Calculo de coste en tiempo real</span>
              <span>«Ajustes de margenes»</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
