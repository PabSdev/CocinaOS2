import { ArrowRight01Icon, CookingPotIcon, Dish01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { Cta, Icon, items, staggerStyle, StatusBadge } from './LandingShared';

function ProductPreview() {
  return (
    <div
      className="product-preview"
      data-reveal="scale"
      aria-label="Vista ilustrativa de inventario y costes de CocinaOS"
    >
      <div className="product-preview-chrome" aria-hidden="true">
        <div className="window-dots">
          <span />
          <span />
          <span />
        </div>
        <div className="window-capsule">CocinaOS / Inventario activo</div>
        <span className="landing-badge landing-badge-green">En vivo</span>
      </div>
      <div className="product-preview-frame">
        <div className="product-preview-rail" aria-hidden="true">
          <span className="product-preview-rail-item product-preview-rail-active">
            <Icon icon={CookingPotIcon} size={14} />
            Ingredientes
          </span>
          <span className="product-preview-rail-item">
            <Icon icon={Dish01Icon} size={14} />
            Platos
          </span>
          <span className="product-preview-rail-divider" />
          <span className="product-preview-rail-item product-preview-muted">
            Recetas <small>Pronto</small>
          </span>
          <span className="product-preview-rail-item product-preview-muted">
            Ventas <small>Pronto</small>
          </span>
        </div>
        <div className="product-preview-main">
          <div className="product-preview-body">
            <div className="product-preview-title">
              <div>
                <p>Almacén principal</p>
                <h2>Ingredientes</h2>
              </div>
              <span className="preview-new">+ Nuevo ingrediente</span>
            </div>
            <div className="preview-metrics">
              <div><small>Ingredientes activos</small><strong>24</strong></div>
              <div><small>Requieren revisión</small><strong>03</strong></div>
              <div><small>Última actualización</small><strong>Hoy</strong></div>
            </div>
            <div className="preview-toolbar">
              <span className="preview-search-pill">
                <Icon icon={Search01Icon} size={12} />
                Buscar ingrediente
              </span>
              <span className="preview-filter-pill">Todos los estados</span>
            </div>
            <div className="preview-table" role="table" aria-label="Ingredientes de ejemplo">
              <div className="preview-table-row preview-table-head" role="row">
                <span>Ingrediente</span>
                <span>Stock</span>
                <span>Coste</span>
                <span>Estado</span>
              </div>
              {items.map(([name, stock, cost, status], index) => (
                <div
                  className="preview-table-row stagger-item"
                  style={staggerStyle(index)}
                  role="row"
                  key={name}
                >
                  <strong>{name}</strong>
                  <span>{stock}</span>
                  <span>{cost}</span>
                  <StatusBadge low={status === 'Stock bajo'} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="preview-cost-card">
        <div className="preview-cost-card-head">
          <span className="landing-badge landing-badge-blue">Próximamente</span>
          <span aria-hidden="true">↗</span>
        </div>
        <p>Pizza Margherita</p>
        <div className="preview-cost-line">
          <span>Coste por ración</span>
          <strong>3,07 €</strong>
        </div>
        <div className="preview-cost-line">
          <span>Food cost</span>
          <strong>25,8 %</strong>
        </div>
      </div>
      <span className="preview-caption">
        Datos ilustrativos de ejemplo. El cálculo de escandallo corresponde a una próxima versión.
      </span>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="landing-hero" id="producto">
      <div className="landing-shell hero-content">
        <div className="hero-copy" data-reveal="up">
          <span className="landing-eyebrow-pill">Gestión operativa para cocinas</span>
          <h1>
            Controla tu cocina.
            <br />
            <span>Conoce tus costes.</span>
            <br />
            Protege tus márgenes.
          </h1>
          <p className="hero-description">
            Ingredientes, platos y existencias en un único registro claro para tomar decisiones con
            datos reales cada día.
          </p>
          <div className="hero-actions">
            <Cta />
            <a className="landing-secondary-pill" href="#como-funciona">
              Ver cómo funciona <Icon icon={ArrowRight01Icon} size={16} />
            </a>
          </div>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}
