import type {
  EscandalloLineBreakdown,
  EscandalloLineInput,
  EscandalloWarningCode,
  RecipeEscandalloResult,
} from './escandallo';
import type { RecipeUnit } from './types';

export function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseDishPrice(rawPrice: string | number | null | undefined): number | null {
  if (typeof rawPrice === 'number') {
    return Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : null;
  }
  if (typeof rawPrice !== 'string') return null;
  const cleaned = rawPrice
    .replace(/[€$\s]/g, '')
    .replace(',', '.')
    .trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

export function getCompatibleUnits(baseUnit: RecipeUnit): RecipeUnit[] {
  const upper = baseUnit.toUpperCase() as RecipeUnit;
  if (upper === 'G' || upper === 'KG') return ['G', 'KG'];
  if (upper === 'ML' || upper === 'L') return ['ML', 'L'];
  return [upper];
}

export function normalizeRecipeQuantity(
  amount: number,
  fromUnit: RecipeUnit,
  toUnit: string,
): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  const from = fromUnit.toUpperCase();
  const to = toUnit.toUpperCase();

  if (from === to) return amount;
  if (from === 'G' && to === 'KG') return amount / 1000;
  if (from === 'KG' && to === 'G') return amount * 1000;
  if (from === 'ML' && to === 'L') return amount / 1000;
  if (from === 'L' && to === 'ML') return amount * 1000;

  return null;
}

export function resolveEffectiveWastage(
  mermaRecetaPct: number | null | undefined,
  mermaHabitualPct: number | null | undefined,
): { pct: number; origen: 'receta' | 'ingrediente' | 'ninguna'; valid: boolean } {
  if (mermaRecetaPct != null) {
    const valid = Number.isFinite(mermaRecetaPct) && mermaRecetaPct >= 0 && mermaRecetaPct < 100;
    return { pct: mermaRecetaPct, origen: 'receta', valid };
  }
  if (mermaHabitualPct != null) {
    const valid =
      Number.isFinite(mermaHabitualPct) && mermaHabitualPct >= 0 && mermaHabitualPct < 100;
    return { pct: mermaHabitualPct, origen: 'ingrediente', valid };
  }
  return { pct: 0, origen: 'ninguna', valid: true };
}

export function calculateGrossQuantity(usableQty: number, wastagePct: number): number | null {
  if (!Number.isFinite(usableQty) || usableQty < 0) return null;
  if (!Number.isFinite(wastagePct) || wastagePct < 0 || wastagePct >= 100) return null;
  const yieldRate = 1 - wastagePct / 100;
  if (yieldRate <= 0) return null;
  return usableQty / yieldRate;
}

/** Separa el IVA del PVP y calcula márgenes sobre el ingreso neto por ración. */
function calculateRecipeProfitability(
  costeTotalRacion: number,
  dishPriceGross: string | number | null | undefined,
  vatRatePct: number | undefined,
) {
  const ivaPct =
    vatRatePct !== undefined && Number.isFinite(vatRatePct) && vatRatePct >= 0 ? vatRatePct : 10;

  const pvpCartaConIva = parseDishPrice(dishPriceGross);
  const pvpValido = pvpCartaConIva !== null && pvpCartaConIva > 0;
  const ingresoNetoSinIva = pvpValido ? round4(pvpCartaConIva / (1 + ivaPct / 100)) : null;
  const cuotaIva =
    pvpCartaConIva !== null && ingresoNetoSinIva !== null
      ? round4(pvpCartaConIva - ingresoNetoSinIva)
      : null;

  const margenBrutoRacion =
    ingresoNetoSinIva !== null ? round4(ingresoNetoSinIva - costeTotalRacion) : null;

  // Un PVP positivo puede dejar un ingreso neto redondeado a cero: no se divide por él.
  const ingresoNetoPositivo = ingresoNetoSinIva !== null && ingresoNetoSinIva > 0;
  const foodCostPct = ingresoNetoPositivo
    ? round2((costeTotalRacion / ingresoNetoSinIva) * 100)
    : null;

  const margenBrutoPct =
    ingresoNetoPositivo && margenBrutoRacion !== null
      ? round2((margenBrutoRacion / ingresoNetoSinIva) * 100)
      : null;

  return {
    pvpCartaConIva,
    ivaPct,
    ingresoNetoSinIva,
    cuotaIva,
    margenBrutoRacion,
    foodCostPct,
    margenBrutoPct,
  };
}

/** Calcula cantidades, costes y raciones disponibles de un ingrediente por ración. */
export function calculateIngredientLineCost(input: EscandalloLineInput): EscandalloLineBreakdown {
  const warnings: EscandalloWarningCode[] = [];
  const merma = resolveEffectiveWastage(input.mermaRecetaPct, input.mermaHabitualPct);

  if (!merma.valid) {
    warnings.push('MERMA_INVALIDA');
  }

  const cantidadUtilEnUnidadCompra = normalizeRecipeQuantity(
    input.cantidadUtil,
    input.unidadReceta,
    input.unidadCompra,
  );

  if (cantidadUtilEnUnidadCompra === null) {
    warnings.push('UNIDAD_INCOMPATIBLE');
  }

  // La cantidad bruta incluye la merma; una merma inválida produce null.
  const cantidadBrutaEnUnidadReceta = calculateGrossQuantity(input.cantidadUtil, merma.pct);

  const cantidadBrutaEnUnidadCompra =
    cantidadUtilEnUnidadCompra !== null
      ? calculateGrossQuantity(cantidadUtilEnUnidadCompra, merma.pct)
      : null;

  // Cero es un precio válido; null representa un precio ausente o inválido.
  const precioCompra =
    input.precioCompraUnitario !== null &&
    Number.isFinite(input.precioCompraUnitario) &&
    input.precioCompraUnitario >= 0
      ? input.precioCompraUnitario
      : null;

  if (precioCompra === null) {
    warnings.push('SIN_PRECIO');
  }

  // Se calculan los costes antes de redondear las cantidades que se muestran.
  const costeUtil =
    precioCompra !== null && cantidadUtilEnUnidadCompra !== null
      ? round4(cantidadUtilEnUnidadCompra * precioCompra)
      : null;

  const costeLinea =
    precioCompra !== null && cantidadBrutaEnUnidadCompra !== null
      ? round4(cantidadBrutaEnUnidadCompra * precioCompra)
      : null;

  const costeMerma =
    costeLinea !== null && costeUtil !== null ? round4(costeLinea - costeUtil) : null;

  // El stock se consume en unidades de compra e incluye la cantidad perdida por merma.
  const racionesPosiblesStock =
    input.stockActual !== undefined &&
    cantidadBrutaEnUnidadCompra !== null &&
    cantidadBrutaEnUnidadCompra > 0
      ? Math.max(0, Math.floor(input.stockActual / cantidadBrutaEnUnidadCompra))
      : null;

  return {
    id: input.id,
    ingredienteId: input.ingredienteId,
    nombre: input.nombre,
    cantidadUtil: input.cantidadUtil,
    unidadReceta: input.unidadReceta,
    unidadCompra: input.unidadCompra,
    mermaAplicadaPct: merma.valid ? round2(merma.pct) : merma.pct,
    mermaOrigen: merma.origen,
    rendimientoPct: merma.valid ? round2(100 - merma.pct) : 0,
    cantidadUtilNormalizada:
      cantidadUtilEnUnidadCompra !== null ? round4(cantidadUtilEnUnidadCompra) : null,
    cantidadBrutaReceta:
      cantidadBrutaEnUnidadReceta !== null ? round4(cantidadBrutaEnUnidadReceta) : null,
    cantidadBrutaNormalizada:
      cantidadBrutaEnUnidadCompra !== null ? round4(cantidadBrutaEnUnidadCompra) : null,
    precioCompraUnitario: precioCompra,
    costeUtil,
    costeMerma,
    costeLinea,
    pesoCostePct: 0,
    racionesPosiblesStock,
    warnings,
  };
}

/** Agrega los costes calculables y obtiene la rentabilidad por ración, descontando el IVA. */
export function calculateRecipeEscandallo(params: {
  lines: EscandalloLineInput[];
  dishPriceGross?: string | number | null;
  vatRatePct?: number;
}): RecipeEscandalloResult {
  const lineasCalculadas = params.lines.map(calculateIngredientLineCost);
  const avisos = new Set<EscandalloWarningCode>();

  let sumaCosteUtil = 0;
  let sumaCosteTotal = 0;
  let incompleto = false;
  let minimoRaciones = Infinity;

  // Las líneas con avisos no entran en el coste total; el resultado queda marcado como parcial.
  for (const line of lineasCalculadas) {
    for (const aviso of line.warnings) avisos.add(aviso);
    if (line.costeLinea === null || line.warnings.length > 0) {
      incompleto = true;
    } else {
      sumaCosteTotal += line.costeLinea;
      sumaCosteUtil += line.costeUtil ?? 0;
    }
    if (line.racionesPosiblesStock !== null && line.racionesPosiblesStock < minimoRaciones) {
      minimoRaciones = line.racionesPosiblesStock;
    }
  }

  // Se conserva la precisión de cuatro decimales; el importe para mostrar se redondea aparte.
  const costeTotalRacion = round4(sumaCosteTotal);
  const costeNetoUtilRacion = round4(sumaCosteUtil);
  const costeMermaRacion = round4(costeTotalRacion - costeNetoUtilRacion);

  const lineasConPesoCoste = lineasCalculadas.map((line) => ({
    ...line,
    pesoCostePct:
      costeTotalRacion > 0 && line.costeLinea !== null
        ? round2((line.costeLinea / costeTotalRacion) * 100)
        : 0,
  }));

  const rentabilidad = calculateRecipeProfitability(
    costeTotalRacion,
    params.dishPriceGross,
    params.vatRatePct,
  );
  if (rentabilidad.ingresoNetoSinIva === null) {
    avisos.add('PVP_NO_CALCULABLE');
  }

  return {
    lines: lineasConPesoCoste,
    costeNetoUtilRacion,
    costeMermaRacion,
    costeTotalRacion,
    costeTotalRacionRedondeado: round2(costeTotalRacion),
    ...rentabilidad,
    // Infinity indica que ninguna línea aportó un límite de stock conocido.
    racionesPosiblesStock: Number.isFinite(minimoRaciones) ? minimoRaciones : null,
    incompleto,
    warnings: Array.from(avisos),
  };
}

export function calculateRecommendedDishPrice(params: {
  costeTotalRacion: number;
  targetFoodCostPct: number;
  ivaPct: number;
}): { precioNetoObjetivo: number; pvpRecomendadoConIva: number } | null {
  const { costeTotalRacion, targetFoodCostPct, ivaPct } = params;
  if (
    !Number.isFinite(costeTotalRacion) ||
    costeTotalRacion <= 0 ||
    !Number.isFinite(targetFoodCostPct) ||
    targetFoodCostPct <= 0 ||
    targetFoodCostPct >= 100
  ) {
    return null;
  }
  const precioNetoObjetivo = round4(costeTotalRacion / (targetFoodCostPct / 100));
  const pvpRecomendadoConIva = round2(precioNetoObjetivo * (1 + ivaPct / 100));
  return { precioNetoObjetivo, pvpRecomendadoConIva };
}
