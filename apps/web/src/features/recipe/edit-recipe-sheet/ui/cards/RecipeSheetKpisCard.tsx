import { Button, Input } from '@/shared/ui';
import { summaryMoney } from './formatters';

interface RecipeSheetKpisCardProps {
  target: string;
  targetPct: number;
  validTarget: boolean;
  recommendedPrice: number | null;
  canShowMargin: boolean;
  cost: number | null;
  price: string;
  pending: boolean;
  ingresoNetoSinIva: number | null;
  cuotaIva?: number | null;
  margenBrutoRacion?: number | null;
  margenBrutoPct?: number | null;
  vatRate: number;
  onVatRateChange: (rate: number) => void;
  onTargetChange: (value: string) => void;
  onApplyRecommendedPrice: () => void;
  onPriceChange: (value: string) => void;
}

const PRESETS = [
  { pct: '25', label: '25 %' },
  { pct: '30', label: '30 % (Estándar)' },
  { pct: '35', label: '35 %' },
];

export const VAT_OPTIONS = [
  { rate: 10, label: '10 %', title: 'Hostelería (estándar)' },
  { rate: 21, label: '21 %', title: 'General (bebidas)' },
  { rate: 4, label: '4 %', title: 'Superreducido' },
] as const;

export function RecipeSheetKpisCard({
  target,
  targetPct,
  validTarget,
  recommendedPrice,
  canShowMargin,
  cost,
  price,
  pending,
  ingresoNetoSinIva,
  cuotaIva,
  margenBrutoRacion,
  margenBrutoPct,
  vatRate,
  onVatRateChange,
  onTargetChange,
  onApplyRecommendedPrice,
  onPriceChange,
}: RecipeSheetKpisCardProps) {
  return (
    <div className="rounded-[20px] border border-[#dce3e9] bg-white p-4 sm:p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)] space-y-3.5">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#55667e]">
          Simulación de PVP y rentabilidad
        </span>
        <h3 className="mt-0.5 text-base font-semibold tracking-[-0.02em] text-[#142238]">
          Food Cost y precio de carta
        </h3>
        <p className="text-xs text-[#64748b]">
          Ajusta el margen deseado y el tipo impositivo para calcular el PVP.
        </p>
      </div>

      {/* Objetivo Food Cost */}
      <div className="space-y-1">
        <label htmlFor="target-food-cost" className="text-xs font-medium text-[#55667e]">
          Objetivo Food Cost
        </label>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map(({ pct, label }) => (
            <button
              key={pct}
              type="button"
              onClick={() => onTargetChange(pct)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer ${
                target === pct
                  ? 'bg-[#112747] text-white shadow-xs'
                  : 'border border-[#dce3e9] bg-[#eff4f8] text-[#55667e] hover:bg-[#e1e9f0] hover:text-[#112747]'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="relative w-20">
            <Input
              id="target-food-cost"
              inputMode="decimal"
              value={target}
              aria-invalid={!validTarget}
              aria-describedby={!validTarget ? 'target-food-cost-error' : undefined}
              className="h-7 rounded-full border-[#cbd7e3] pr-6 text-right text-xs font-semibold tabular-nums"
              onChange={(event) => onTargetChange(event.target.value)}
            />
            <span
              className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-[#64748b]"
              aria-hidden="true"
            >
              %
            </span>
          </div>
        </div>
        {!validTarget && (
          <p id="target-food-cost-error" className="text-xs font-medium text-[#962b29]">
            Introduce un porcentaje mayor que 0 y menor que 100.
          </p>
        )}
      </div>

      {/* Selector de IVA */}
      <div className="space-y-1">
        <span className="block text-xs font-medium text-[#55667e]">Tipo de IVA aplicable</span>
        <div className="grid grid-cols-3 gap-1.5">
          {VAT_OPTIONS.map(({ rate, label, title }) => {
            const active = vatRate === rate;
            return (
              <button
                key={rate}
                type="button"
                onClick={() => onVatRateChange(rate)}
                aria-pressed={active}
                className={`flex flex-col items-center justify-center rounded-xl p-1.5 text-center transition-all cursor-pointer ${
                  active
                    ? 'border-2 border-[#112747] bg-[#112747] text-white shadow-xs'
                    : 'border border-[#dce3e9] bg-[#eff4f8] text-[#55667e] hover:bg-[#e1e9f0] hover:text-[#112747]'
                }`}
              >
                <span className="text-xs font-bold tabular-nums">{label}</span>
                <span
                  className={`text-[10px] leading-tight truncate w-full ${
                    active ? 'text-white/85' : 'text-[#64748b]'
                  }`}
                  title={title}
                >
                  {title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjeta PVP recomendado */}
      <div className="rounded-2xl border border-[#dce3e9] bg-[#eff4f8]/70 p-3 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-medium text-[#55667e] block">
              PVP recomendado (IVA {vatRate} %)
            </span>
            <span className="text-xl font-bold text-[#142238] tabular-nums">
              {summaryMoney(recommendedPrice)}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={pending || recommendedPrice === null || recommendedPrice <= 0}
            onClick={onApplyRecommendedPrice}
            className="h-8 rounded-full bg-[#112747] px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-[#19355e]"
          >
            Aplicar a carta
          </Button>
        </div>
        <span className="text-[11px] text-[#64748b] block">
          Sobre coste {summaryMoney(canShowMargin ? cost : null)} y {targetPct || 30} % Food Cost.
        </span>
      </div>

      {/* PVP en carta y desglose de IVA */}
      <div className="space-y-1.5 pt-0.5">
        <label htmlFor="recipe-pvp" className="text-xs font-semibold text-[#142238]">
          PVP fijado en carta con IVA (€)
        </label>
        <Input
          id="recipe-pvp"
          value={price}
          maxLength={50}
          inputMode="decimal"
          disabled={pending}
          onChange={(event) => onPriceChange(event.target.value)}
          className="h-9 rounded-xl border-[#cbd7e3] font-semibold tabular-nums text-sm"
        />

        {/* Desglose de base imponible, cuota de IVA y margen */}
        <div className="rounded-xl border border-[#dce3e9]/80 bg-[#eff4f8]/60 p-2.5 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-[#55667e]">
            <span>Ingreso neto sin IVA ({vatRate} %):</span>
            <span className="font-semibold text-[#142238] tabular-nums">
              {summaryMoney(ingresoNetoSinIva)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[#55667e]">
            <span>Cuota IVA ({vatRate} %):</span>
            <span className="tabular-nums text-[#142238]">{summaryMoney(cuotaIva ?? null)}</span>
          </div>
          {canShowMargin && (
            <div className="flex items-center justify-between border-t border-[#dce3e9]/80 pt-1 text-[#55667e]">
              <span>Margen bruto por ración:</span>
              <strong className="font-semibold tabular-nums text-[#26592b]">
                {summaryMoney(margenBrutoRacion ?? null)}
                {margenBrutoPct != null ? ` (${margenBrutoPct.toFixed(1)} %)` : ''}
              </strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
