import Image from 'next/image';
import { staggerStyle } from './LandingShared';

export function CostSection() {
  const ingredients = [
    ['Harina de fuerza', '250 g', '0,31 €'],
    ['Tomate triturado', '120 g', '0,34 €'],
    ['Mozzarella fresca', '100 g', '0,74 €'],
    ['Aceite de oliva y albahaca', '18 g', '1,47 €'],
  ] as const;

  return (
    <section className="landing-section cost-section" id="costes">
      <div className="landing-shell">
        <div className="section-header" data-reveal="up">
          <h2>Conoce exactamente cuánto cuesta cada plato.</h2>
          <p>
            El módulo de escandallos conectará el precio actualizado de tus ingredientes con cada
            receta para proteger el margen de tu carta.
          </p>
        </div>

        <div className="cost-composition" data-reveal="scale">
          <div className="cost-media">
            <div className="cost-photo">
              <Image
                src="/images/pizza-margherita.png"
                alt="Pizza Margherita sobre un plato de cerámica"
                fill
                sizes="(max-width: 900px) 100vw, 46vw"
              />
            </div>
            <div className="cost-photo-caption">
              <strong>Plato: Pizza Margherita</strong>
              <span className="landing-badge landing-badge-blue">Ficha técnica conceptual</span>
            </div>
          </div>

          <div className="cost-ledger">
            <div className="cost-ledger-head">
              <div>
                <h3>Desglose de coste por ración</h3>
                <p>Cantidades medidas sobre el inventario activo de cocina.</p>
              </div>
              <span className="landing-badge landing-badge-blue">Próximamente</span>
            </div>

            <div className="cost-ingredients">
              {ingredients.map(([name, amount, price], index) => (
                <div className="stagger-item" style={staggerStyle(index)} key={name}>
                  <span>{name}</span>
                  <span className="cost-amount-pill">{amount}</span>
                  <strong>{price}</strong>
                </div>
              ))}
            </div>

            <div className="cost-calculation">
              <div>
                <span>Coste de ingredientes</span>
                <strong>2,86 €</strong>
              </div>
              <div>
                <span>Merma estimada (7 %)</span>
                <strong>0,21 €</strong>
              </div>
              <div className="cost-total">
                <span>Coste total por ración</span>
                <strong>3,07 €</strong>
              </div>
            </div>

            <div className="cost-outcome">
              <div>
                <small>Precio de venta en carta</small>
                <strong>11,90 €</strong>
              </div>
              <div>
                <small>Food cost calculado</small>
                <strong>25,8 %</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
