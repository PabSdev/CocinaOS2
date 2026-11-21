import {
  CookingPotIcon,
  Dish01Icon,
  Invoice01Icon,
  PackageIcon,
} from '@hugeicons/core-free-icons';
import { Icon, staggerStyle } from './LandingShared';

export function FlowSection() {
  const steps = [
    {
      icon: CookingPotIcon,
      name: 'Ingredientes',
      description: 'Registra materias primas, unidades de medida, stock actual y coste por unidad.',
      availability: 'Disponible',
      tone: 'green',
    },
    {
      icon: Dish01Icon,
      name: 'Platos y carta',
      description: 'Organiza las elaboraciones activas de tu cocina con sus precios y categorías.',
      availability: 'Disponible',
      tone: 'green',
    },
    {
      icon: Invoice01Icon,
      name: 'Recetas y costes',
      description: 'Vincula cantidades por ración para calcular el coste exacto y el food cost.',
      availability: 'Disponible',
      tone: 'green',
    },
    {
      icon: PackageIcon,
      name: 'Ventas y stock',
      description: 'Descuenta automáticamente los ingredientes consumidos tras cada servicio.',
      availability: 'Próximamente',
      tone: 'blue',
    },
  ] as const;

  return (
    <section className="landing-section flow-section" id="como-funciona">
      <div className="landing-shell">
        <div className="section-header" data-reveal="up">
          <span className="landing-eyebrow-pill">Flujo conectado</span>
          <h2>De la materia prima a cada ración servida.</h2>
          <p>
            Una estructura pensada para que el inventario diario sea la base directa de tus platos,
            recetas y márgenes operativos.
          </p>
        </div>

        <div className="flow-bento" data-reveal="stagger" aria-label="Etapas del producto">
          {steps.map(({ icon: StepIcon, name, description, availability, tone }, index) => (
            <div className="flow-card stagger-item" style={staggerStyle(index)} key={name}>
              <div className="flow-card-head">
                <span className="flow-icon-capsule">
                  <Icon icon={StepIcon} size={18} />
                </span>
                <span className={`landing-badge landing-badge-${tone}`}>{availability}</span>
              </div>
              <strong>{name}</strong>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
