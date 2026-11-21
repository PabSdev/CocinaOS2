import Link from 'next/link';

const LIVE_LEDGER_PREVIEW = [
  {
    item: 'Solomillo de vaca madurada',
    stock: '18,40 kg',
    coste: '28,90 €/kg',
    merma: '4,2 %',
    estado: 'Disponible',
    pillBg: 'bg-[#edf3ec]',
    pillText: 'text-[#26592b]',
  },
  {
    item: 'Mantequilla avellana DOP',
    stock: '3,50 kg',
    coste: '11,40 €/kg',
    merma: '1,5 %',
    estado: 'Stock bajo',
    pillBg: 'bg-[#fbf3db]',
    pillText: 'text-[#8a5700]',
  },
  {
    item: 'Fondo oscuro de ternera',
    stock: '24,00 l',
    coste: '4,75 €/l',
    merma: '0,0 %',
    estado: 'Disponible',
    pillBg: 'bg-[#edf3ec]',
    pillText: 'text-[#26592b]',
  },
] as const;

export function AuthEditorialPanel() {
  return (
    <aside
      aria-label="Identidad operativa de CocinaOS"
      className="relative hidden flex-col justify-between overflow-hidden border-r border-[#dce3e9] bg-[#eff4f8] p-10 lg:flex xl:p-14"
    >
      {/* Cabecera de marca */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#112747]"
        >
          <span className="inline-flex h-8 w-8 flex-col items-start justify-center gap-1 rounded-[10px] bg-[#112747] px-2">
            <span className="h-0.5 w-4 rounded-full bg-white" />
            <span className="h-0.5 w-3 rounded-full bg-[#8ab8e6]" />
            <span className="h-0.5 w-3.5 rounded-full bg-white" />
          </span>
          <span>
            Cocina<span className="text-[#3e81d0]">OS</span>
          </span>
        </Link>

        <span className="inline-flex items-center rounded-full bg-[#edf3ec] px-3 py-1 text-xs font-semibold text-[#26592b]">
          El registro a la vista
        </span>
      </div>

      {/* Declaración empresarial y registro operativo en vivo */}
      <div className="my-auto space-y-8 py-8">
        <blockquote className="space-y-4">
          <p className="text-[clamp(28px,2.5vw,38px)] leading-[1.12] font-semibold tracking-[-0.035em] text-[#112747]">
            «La rentabilidad de una cocina no se adivina en el cierre de mes; se
            defiende servicio a servicio, gramo a gramo.»
          </p>
          <footer className="text-sm font-medium text-[#55667e]">
            Control de existencias, mermas y escandallos dinámicos para obradores,
            restaurantes y grupos gastronómicos.
          </footer>
        </blockquote>

        {/* Isla de demostración de registro con números tabulares */}
        <div className="rounded-[20px] border border-[#dce3e9] bg-white p-5">
          <div className="mb-3.5 flex items-center justify-between border-b border-[#dce3e9] pb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#55667e]">
                Partida de carnes y fondos
              </p>
              <p className="text-sm font-semibold text-[#142238]">
                Control de cámara principal
              </p>
            </div>
            <span className="rounded-full bg-[#e1f3fe] px-2.5 py-1 text-xs font-semibold text-[#1c608f] tabular-nums">
              Food cost: 24,8 %
            </span>
          </div>

          <div className="divide-y divide-[#eff4f8]">
            {LIVE_LEDGER_PREVIEW.map((row) => (
              <div
                key={row.item}
                className="flex items-center justify-between py-2.5 text-xs"
              >
                <div className="min-w-0 pr-3">
                  <p className="truncate font-semibold text-[#142238]">
                    {row.item}
                  </p>
                  <p className="text-[#55667e] tabular-nums">
                    Coste: {row.coste} | Merma: {row.merma}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-[#142238] tabular-nums">
                    {row.stock}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${row.pillBg} ${row.pillText}`}
                  >
                    {row.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pie con métricas operativas */}
      <div className="grid grid-cols-3 gap-4 border-t border-[#dce3e9] pt-6">
        <div>
          <p className="text-xl font-bold tracking-tight text-[#112747] tabular-nums">
            100 %
          </p>
          <p className="text-xs font-medium text-[#55667e]">
            Trazabilidad de partidas
          </p>
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight text-[#112747] tabular-nums">
            -18,4 %
          </p>
          <p className="text-xs font-medium text-[#55667e]">
            Reducción de merma oculta
          </p>
        </div>
        <div>
          <p className="text-xl font-bold tracking-tight text-[#112747] tabular-nums">
            &lt; 2 min
          </p>
          <p className="text-xs font-medium text-[#55667e]">
            Cálculo de escandallo neto
          </p>
        </div>
      </div>
    </aside>
  );
}
