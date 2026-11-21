'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import type { NavItem } from '../model/types'

interface SidebarItemProps {
  item: NavItem
  isActive: boolean
  isCollapsed: boolean
  onClick?: () => void
}

export function SidebarItem({ item, isActive, isCollapsed, onClick }: SidebarItemProps) {
  const className = `flex min-h-10 items-center gap-3 rounded-full px-3.5 text-[13px] transition-all duration-200 ${
    isCollapsed ? 'justify-center px-2' : ''
  } ${
    item.disabled
      ? 'cursor-not-allowed text-[#55667e]/75'
      : isActive
        ? 'bg-[#112747] font-semibold text-white shadow-[0_4px_12px_-2px_rgba(17,39,71,0.28)]'
        : 'font-medium text-[#465870] hover:bg-[#eff4f8] hover:text-[#112747]'
  }`

  const content = (
    <>
      <HugeiconsIcon
        icon={item.icon}
        className="size-4.5 shrink-0"
        strokeWidth={isActive ? 2 : 1.8}
      />
      {!isCollapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="shrink-0 rounded-full border border-[#1c608f]/15 bg-[#e1f3fe] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#1c608f]">
              {item.badge}
            </span>
          )}
        </>
      )}
    </>
  )

  if (item.disabled) {
    return (
      <span
        className={className}
        aria-disabled="true"
        title={isCollapsed ? `${item.label} (Próximamente)` : undefined}
      >
        {content}
      </span>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={isCollapsed ? item.label : undefined}
      title={isCollapsed ? item.label : undefined}
      className={`${className} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
    >
      {content}
    </Link>
  )
}
