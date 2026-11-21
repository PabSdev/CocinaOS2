import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { Icon, items, staggerStyle, StatusBadge } from './LandingShared';

export function InventorySection() {
  return (
    <section className="landing-section inventory-section" id="funciones">
      <div className="landing-shell">
        <div className="section-header section-header-row" data-reveal="up">
          <div>
            <h2>Tu inventario de cocina, siempre a la vista.</h2>
            <p>
              Consulta existencias con sus unidades, identifica al instante qué productos requieren
              reposición y mantén ordenada tu despensa.
            </p>
          </div>
          <Link className="landing-secondary-pill" href="/ingredientes">
            Abrir aplicación <Icon icon={ArrowUpRight01Icon} size={16} />
          </Link>
        </div>

        <div className="inventory-island" data-reveal="scale">
          <div className="inventory-island-top">
            <div className="inventory-island-meta">
              <strong>Registro de materias primas</strong>
              <span className="landing-badge landing-badge-green">Módulo disponible hoy</span>
            </div>
            <div className="inventory-island-capsules">
              <span>24 ingredientes registrados</span>
              <span>1 alerta de reposición</span>
            </div>
          </div>

          <div className="inventory-visual-head">
            <span>Ingrediente</span>
            <span>Stock disponible</span>
            <span>Coste unitario</span>
            <span>Estado</span>
          </div>

          {items.map(([name, stock, cost, status], index) => (
            <div
              className={`inventory-visual-row stagger-item${
                status === 'Stock bajo' ? ' inventory-highlight' : ''
              }`}
              style={staggerStyle(index)}
              key={name}
            >
              <strong>{name}</strong>
              <span>{stock}</span>
              <span>{cost}</span>
              <StatusBadge low={status === 'Stock bajo'} />
            </div>
          ))}

          <div className="inventory-visual-foot">
            <span>Vista ilustrativa del módulo operativo</span>
            <span>Cada estado incluye etiqueta textual además de color</span>
          </div>
        </div>
      </div>
    </section>
  );
}
