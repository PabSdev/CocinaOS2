export function RecipeSheetInformationCalculation() {
  return (
    <section>
      {/* Card de información técnica que se estira dentro de la card del plato */}
      <details className="mt-3.5 border-t border-[#edf1f5] pt-3 text-xs text-[#55667e]">
        <summary className="cursor-pointer font-semibold text-[#142238] hover:text-[#112747] transition-colors inline-flex items-center gap-1.5">
          <span>Cómo se calculan las cantidades, mermas y rentabilidad</span>
        </summary>
        <ul className="mt-2.5 grid gap-1.5 leading-relaxed rounded-xl bg-[#eff4f8]/50 p-3 border border-[#dce3e9]/70">
          <li>
            <strong className="text-[#142238]">Cantidad útil vs. bruta:</strong> La cantidad útil es
            la que termina en el plato servido. La bruta es la que se retira de almacén considerando
            el rendimiento del ingrediente (con un 20 % de merma, 80 g útiles requieren 100 g
            brutos).
          </li>
          <li>
            <strong className="text-[#142238]">Merma de compra:</strong> Si no se define una merma
            específica para la receta, se aplica automáticamente la merma habitual registrada en la
            ficha del ingrediente.
          </li>
          <li>
            <strong className="text-[#142238]">Food Cost y Margen:</strong> El Food Cost (%)
            representa qué proporción del ingreso neto (PVP sin IVA) corresponde al coste total de
            materias primas. El margen bruto es la diferencia en euros y porcentaje.
          </li>
        </ul>
      </details>
    </section>
  );
}
