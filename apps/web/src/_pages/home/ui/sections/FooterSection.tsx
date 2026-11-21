import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import Link from 'next/link';
import { Brand, Cta, demoHref, Icon } from './LandingShared';

export function PricingSection() {
  return (
    <section className="landing-section pricing-section" id="precios">
      <div className="landing-shell">
        <div className="pricing-island" data-reveal="scale">
          <div className="pricing-copy">
            <span className="landing-eyebrow-pill">Acceso anticipado</span>
            <h2>Simple y transparente desde el primer día.</h2>
            <p>
              Estamos ultimando los planes de CocinaOS para cocinas independientes y grupos de
              restauración. Cuéntanos cómo trabajas hoy y te daremos acceso directo a una demo
              guiada.
            </p>
            <div className="pricing-highlights">
              <span className="landing-badge landing-badge-green">Inventario y platos activos</span>
              <span className="landing-badge landing-badge-blue">
                Hoja de ruta de costes incluida
              </span>
            </div>
          </div>

          <div className="pricing-panel">
            <span className="landing-badge landing-badge-amber">Planes en preparación</span>
            <strong>Hablemos de tu cocina.</strong>
            <p>
              Sin compromisos ni tarifas cerradas antes de conocer el volumen y las necesidades de
              tu equipo.
            </p>
            <div className="pricing-actions">
              <Cta />
              <Link className="landing-secondary-pill" href="/ingredientes">
                Abrir aplicación <Icon icon={ArrowUpRight01Icon} size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FooterSection() {
  return (
    <>
      <section className="landing-final">
        <div className="landing-shell">
          <div className="final-cta-island" data-reveal="scale">
            <h2>Deja de adivinar cuánto cuesta tu cocina.</h2>
            <p>
              Empieza hoy organizando tus ingredientes y platos en un registro claro, diseñado con
              la misma limpieza con la que diriges cada servicio.
            </p>
            <div className="final-cta-actions">
              <Cta />
              <Link className="landing-secondary-pill" href="/ingredientes">
                Abrir aplicación <Icon icon={ArrowUpRight01Icon} size={16} />
              </Link>
            </div>
            <small>
              No necesitas cambiar cómo cocina tu equipo, solo dejar de llevar las cuentas a mano.
            </small>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-shell landing-footer-inner">
          <div className="footer-brand-col">
            <Brand />
            <p>Una cocina más rentable empieza por tener el inventario y los costes a la vista.</p>
          </div>
          <div className="footer-links">
            <div>
              <strong>Secciones</strong>
              <a href="#producto">Inicio</a>
              <a href="#problema">Problema</a>
              <a href="#como-funciona">Cómo funciona</a>
              <a href="#funciones">Inventario</a>
              <a href="#costes">Costes</a>
              <a href="#demo">Demo</a>
              <a href="#precios">Precios</a>
            </div>
            <div>
              <strong>Acceso</strong>
              <Link href="/iniciar-sesion">Iniciar sesión</Link>
              <Link href="/crear-cuenta">Crear cuenta</Link>
              <a href={demoHref}>Solicitar demo</a>
            </div>
          </div>
        </div>
        <div className="landing-shell footer-bottom">
          <span>© {new Date().getFullYear()} CocinaOS</span>
          <span>Inventario y control operativo para cocinas profesionales.</span>
        </div>
      </footer>
    </>
  );
}
