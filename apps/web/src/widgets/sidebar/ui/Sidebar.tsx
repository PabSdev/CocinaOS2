'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { SidebarLeftIcon, SidebarRightIcon } from '@hugeicons/core-free-icons'
import { SIDEBAR_SECTIONS } from '../model/nav-items'
import { SidebarItem } from './SidebarItem'
import { LogoutButton } from '@/features/auth'

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  function toggleCollapse() {
    setIsCollapsed((collapsed) => !collapsed)
  }

  function isActive(href: string) {
    if (href === '/ingredientes') return pathname === '/' || pathname.startsWith('/ingredientes')
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[#dce3e9] bg-white/90 backdrop-blur-md text-[#142238] transition-[width] duration-200 ease-out md:flex ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
      aria-label="Navegación principal"
    >
      <div
        className={`flex h-18 shrink-0 items-center border-b border-[#dce3e9] px-4 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!isCollapsed && (
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="CocinaOS, volver a portada"
          >
            <span
              className="flex size-7 shrink-0 items-end gap-[3px] rounded-[7px] border-[1.5px] border-[#112747] p-[5px] text-[#112747] -rotate-6 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105"
              aria-hidden="true"
            >
              <span className="h-[9px] w-1 rounded-[1px] bg-current" />
              <span className="h-4 w-1 rounded-[1px] bg-current" />
              <span className="h-1.5 w-1 rounded-[1px] bg-current" />
            </span>
            <span className="min-w-0">
              <span className="block text-[19px] font-bold tracking-[-0.045em] text-[#112747] leading-none">
                Cocina<span className="font-normal">OS</span>
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-[#55667e]">
                Espacio de cocina
              </span>
            </span>
          </Link>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-transparent text-[#55667e] transition-colors hover:border-[#dce3e9] hover:bg-[#eff4f8] hover:text-[#112747] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <HugeiconsIcon icon={isCollapsed ? SidebarRightIcon : SidebarLeftIcon} className="size-4.5" />
        </button>
      </div>

      <nav
        className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-5 ${
          isCollapsed ? 'px-2' : 'px-3.5'
        }`}
        aria-label="Secciones de cocina"
      >
        <div className="space-y-6">
          {SIDEBAR_SECTIONS.map((section, index) => (
            <div key={section.title ?? index}>
              {section.title &&
                (isCollapsed ? (
                  <div className="mx-2 mb-3 border-t border-[#dce3e9]" aria-hidden="true" />
                ) : (
                  <h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#55667e]">
                    {section.title}
                  </h2>
                ))}
              <div className="space-y-1">
                {section.items.filter((item) => !item.adminOnly || isAdmin).map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    isActive={isActive(item.href)}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-[#dce3e9] p-3 space-y-2">
        {!isCollapsed && (
          <div className="flex items-center justify-between rounded-full border border-[#e1e9f0] bg-[#eff4f8] px-3.5 py-1.5 text-xs">
            <span className="font-semibold text-[#142238]">Almacén principal</span>
            <span className="inline-flex items-center rounded-full border border-[#26592b]/14 bg-[#edf3ec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#26592b]">
              Activo
            </span>
          </div>
        )}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
          {!isCollapsed && <span className="text-xs font-medium text-[#55667e]">Sesión activa</span>}
          <LogoutButton showText={!isCollapsed} />
        </div>
      </div>
    </aside>
  )
}
