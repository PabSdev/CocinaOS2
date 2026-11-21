'use client'

import { useState } from 'react'
import { ArrowRight01Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export function StockDemo() {
  const [sold, setSold] = useState(false)

  return (
    <div className="bento-card sale-demo-card" data-reveal="left">
      <div className="bento-card-top">
        <div>
          <h3 id="sale-title">Descuento automático por venta</h3>
          <p>
            Cada comanda descuenta al instante los gramos exactos de la receta sobre el inventario activo.
          </p>
        </div>
        <span className="landing-badge landing-badge-blue">Próximamente</span>
      </div>

      <div className="sale-stock-box">
        <div className="sale-stock-meta">
          <span>Ingrediente: Mozzarella fresca</span>
          <span className={`landing-badge ${sold ? 'landing-badge-amber' : 'landing-badge-green'}`}>
            {sold ? 'Descontado (-100 g)' : 'Stock verificado'}
          </span>
        </div>

        <div className="sale-stock-value">
          <strong aria-live="polite" aria-atomic="true">
            {sold ? '3.100' : '3.200'} <small>g</small>
          </strong>
          <span className={sold ? 'sale-change sale-change-visible' : 'sale-change'} aria-hidden={!sold}>
            1x Pizza Margherita registrada en pase
          </span>
        </div>
      </div>

      <div className="sale-demo-bottom">
        <div className="sale-recipe-pill">
          <span>1x Pizza Margherita</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={1.8} aria-hidden="true" />
          <span>100 g mozzarella</span>
        </div>

        <button type="button" className="sale-demo-btn" onClick={() => setSold((prev) => !prev)}>
          {sold ? (
            <>
              <HugeiconsIcon icon={RefreshIcon} size={16} strokeWidth={1.8} aria-hidden="true" />
              Reiniciar simulación
            </>
          ) : (
            <>
              Simular venta
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
