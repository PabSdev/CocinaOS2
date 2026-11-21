interface StockBadgeProps {
  stock: number
}

export function StockBadge({ stock }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-[#962b29]/15 bg-[#fdebec] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#962b29]">
        Agotado
      </span>
    )
  }

  if (stock <= 5) {
    return (
      <span className="inline-flex items-center rounded-full border border-[#8a5700]/16 bg-[#fbf3db] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#8a5700]">
        Stock bajo
      </span>
    )
  }

  return (
    <span className="inline-flex items-center rounded-full border border-[#26592b]/14 bg-[#edf3ec] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#26592b]">
      Disponible
    </span>
  )
}
