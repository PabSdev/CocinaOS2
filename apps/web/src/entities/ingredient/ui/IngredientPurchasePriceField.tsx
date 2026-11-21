'use client'

import { useState, type Ref } from 'react'
import { Button, Input } from '@/shared/ui'
import type { UnidadDeMasa } from '../model/types'
import { formatPurchasePrice, isPurchasePrice, parsePurchasePrice, purchasePriceWithoutVat } from '../model/purchase-price'

interface IngredientPurchasePriceFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  unit: UnidadDeMasa
  disabled?: boolean
  error?: string
  inputRef?: Ref<HTMLInputElement>
}

export function IngredientPurchasePriceField({
  id, value, onChange, unit, disabled, error, inputRef,
}: IngredientPurchasePriceFieldProps) {
  const [expanded, setExpanded] = useState(false)
  const [gross, setGross] = useState('')
  const [vat, setVat] = useState('')
  const grossValue = parsePurchasePrice(gross)
  const vatValue = parsePurchasePrice(vat)
  const grossInvalid = grossValue !== null && !isPurchasePrice(grossValue)
  const vatInvalid = vatValue !== null && !isPurchasePrice(vatValue)
  const result = grossValue === null || vatValue === null
    ? null : purchasePriceWithoutVat(grossValue, vatValue)

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-[#142238]">
        Precio de compra sin IVA (€/{unit})
      </label>
      <Input
        ref={inputRef} id={id} name="precio_compra" inputMode="decimal"
        placeholder="Ej. 2,50" value={value} onChange={(e) => onChange(e.target.value)}
        disabled={disabled} aria-invalid={Boolean(error)}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
        className="min-h-11 rounded-xl border-[#cbd7e3] bg-white tabular-nums text-[#142238]"
      />
      <p id={`${id}-hint`} className="text-xs text-[#55667e]">
        Opcional. Precio por 1 {unit}, sin IVA. Hasta 4 decimales.
      </p>
      {error ? <p id={`${id}-error`} role="alert" className="text-xs font-medium text-[#962b29]">{error}</p> : null}
      <Button
        type="button" variant="ghost" disabled={disabled}
        aria-expanded={expanded} aria-controls={`${id}-calculator`}
        onClick={() => setExpanded((current) => !current)} className="min-h-11 self-start"
      >
        {expanded ? 'Ocultar calculadora de IVA' : 'Calcular precio sin IVA'}
      </Button>
      {expanded ? (
        <fieldset id={`${id}-calculator`} disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && event.target instanceof HTMLInputElement) event.preventDefault()
          }}
          className="flex min-w-0 flex-col gap-3 rounded-xl border border-[#cbd7e3] p-3">
          <legend className="px-1 text-sm font-medium text-[#142238]">Quitar IVA</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-gross`} className="text-sm font-medium text-[#142238]">Precio con IVA (€/{unit})</label>
              <Input id={`${id}-gross`} inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)}
                aria-invalid={grossInvalid} aria-describedby={grossInvalid ? `${id}-gross-error` : undefined} className="min-h-11" />
              {grossInvalid ? <p id={`${id}-gross-error`} role="alert" className="text-xs text-[#962b29]">Introduce un importe igual o mayor que 0.</p> : null}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor={`${id}-vat`} className="text-sm font-medium text-[#142238]">IVA (%)</label>
              <Input id={`${id}-vat`} inputMode="decimal" value={vat} onChange={(e) => setVat(e.target.value)}
                aria-invalid={vatInvalid} aria-describedby={vatInvalid ? `${id}-vat-error` : undefined} className="min-h-11" />
              {vatInvalid ? <p id={`${id}-vat-error`} role="alert" className="text-xs text-[#962b29]">Introduce un porcentaje igual o mayor que 0.</p> : null}
            </div>
          </div>
          <p role="status" className="text-sm tabular-nums text-[#142238]">
            {result === null ? 'Introduce el importe y el porcentaje de IVA.' : `Precio sin IVA: ${formatPurchasePrice(result, unit)}`}
          </p>
          <Button type="button" variant="outline" className="min-h-11 self-start" disabled={disabled || result === null}
            onClick={() => { if (result !== null) onChange(String(result)) }}>
            Aplicar precio sin IVA
          </Button>
        </fieldset>
      ) : null}
    </div>
  )
}
