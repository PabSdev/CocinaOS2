import * as React from 'react'

interface ProductCategoryBadgeProps {
  categoria: string
  className?: string
}

export function ProductCategoryBadge({
  categoria,
  className = '',
}: ProductCategoryBadgeProps) {
  const label = categoria.trim() || 'General'

  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#1c608f]/15 bg-[#e1f3fe] px-2.5 py-0.5 text-xs font-semibold text-[#1c608f] ${className}`}
    >
      {label}
    </span>
  )
}
