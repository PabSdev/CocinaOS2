'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { Menu01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { SIDEBAR_SECTIONS } from '../model/nav-items'
import { SidebarItem } from './SidebarItem'
import { LogoutButton } from '@/features/auth'

export function MobileSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        menuButton.current?.focus()
      }
      if (event.key !== 'Tab' || !panel.current) return
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>('button, a[href]'))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  function closeMenu() {
    setIsOpen(false)
    menuButton.current?.focus()
  }

  function isActive(href: string) {
    if (href === '/ingredientes') return pathname === '/' || pathname.startsWith('/ingredientes')
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <header className="sticky top-0 z-30 px-4 pt-2.5 pb-1 md:hidden">
        <div className="flex h-14 items-center justify-between rounded-full border border-[#cbd7e3] bg-white/90 px-4 shadow-[0_12px_34px_-22px_rgba(17,39,71,0.16)] backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2.5 rounded-full">
            <span
              className="flex size-6.5 shrink-0 items-end gap-[2.5px] rounded-[6px] border-[1.5px] border-[#112747] p-[4px] text-[#112747] -rotate-6"
              aria-hidden="true"
            >
              <span className="h-2 w-[3.5px] rounded-[1px] bg-current" />
              <span className="h-3.5 w-[3.5px] rounded-[1px] bg-current" />
              <span className="h-[5px] w-[3.5px] rounded-[1px] bg-current" />
            </span>
            <span className="text-[18px] font-bold tracking-[-0.045em] text-[#112747]">
              Cocina<span className="font-normal">OS</span>
            </span>
          </Link>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex size-9.5 items-center justify-center rounded-full border border-[#d5dfe9] bg-[#eff4f8] text-[#112747] transition-colors hover:bg-[#e4edf5]"
            aria-label="Abrir menú de navegación"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            <HugeiconsIcon icon={Menu01Icon} className="size-4.5" />
          </button>
        </div>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[#0b1d36]/25 backdrop-blur-xs"
            onClick={closeMenu}
            aria-hidden="true"
          />
          <div
            ref={panel}
            id="mobile-navigation"
            className="relative flex h-full w-[min(20rem,86vw)] flex-col border-r border-[#cbd7e3] bg-white text-[#142238] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navegación principal"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#dce3e9] px-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex size-7 shrink-0 items-end gap-[3px] rounded-[7px] border-[1.5px] border-[#112747] p-[5px] text-[#112747] -rotate-6"
                  aria-hidden="true"
                >
                  <span className="h-[9px] w-1 rounded-[1px] bg-current" />
                  <span className="h-4 w-1 rounded-[1px] bg-current" />
                  <span className="h-1.5 w-1 rounded-[1px] bg-current" />
                </span>
                <div>
                  <span className="block text-[18px] font-bold tracking-[-0.045em] text-[#112747] leading-none">
                    Cocina<span className="font-normal">OS</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium text-[#55667e]">
                    Espacio de cocina
                  </span>
                </div>
              </div>
              <button
                ref={closeButton}
                type="button"
                onClick={closeMenu}
                className="flex size-9.5 items-center justify-center rounded-full border border-[#d5dfe9] bg-[#eff4f8] text-[#112747] hover:bg-[#e4edf5]"
                aria-label="Cerrar menú de navegación"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4.5" />
              </button>
            </div>
            <nav
              className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3.5 py-5"
              aria-label="Secciones de cocina"
            >
              {SIDEBAR_SECTIONS.map((section, index) => (
                <div key={section.title ?? index}>
                  {section.title && (
                    <h2 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.06em] text-[#55667e]">
                      {section.title}
                    </h2>
                  )}
                  <div className="space-y-1">
                    {section.items.filter((item) => !item.adminOnly || isAdmin).map((item) => (
                      <SidebarItem
                        key={item.id}
                        item={item}
                        isActive={isActive(item.href)}
                        isCollapsed={false}
                        onClick={closeMenu}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-t border-[#dce3e9] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between rounded-full border border-[#e1e9f0] bg-[#eff4f8] px-3.5 py-2 text-xs">
                <span className="font-semibold text-[#142238]">Almacén principal</span>
                <span className="inline-flex items-center rounded-full border border-[#26592b]/14 bg-[#edf3ec] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-[#26592b]">
                  Activo
                </span>
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-[#55667e]">Sesión activa</span>
                <LogoutButton showText />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
