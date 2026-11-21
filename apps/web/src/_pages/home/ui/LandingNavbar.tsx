'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight01Icon, Cancel01Icon, Menu01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { buttonVariants } from '@/shared/ui'

const DEMO_HREF = 'mailto:prueba@gmail.com?subject=Solicitud%20de%20demo%20de%20CocinaOS'

export const NAV_SECTIONS = [
  { id: 'producto', label: 'Inicio' },
  { id: 'problema', label: 'Problema' },
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'funciones', label: 'Inventario' },
  { id: 'costes', label: 'Costes' },
  { id: 'demo', label: 'Demo' },
  { id: 'precios', label: 'Precios' },
] as const

type SectionId = (typeof NAV_SECTIONS)[number]['id']

export function LandingNavbar() {
  const [activeId, setActiveId] = useState<SectionId>('producto')
  const [isScrolled, setIsScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pillStyle, setPillStyle] = useState<{ x: number; width: number; ready: boolean }>({
    x: 0,
    width: 0,
    ready: false,
  })

  const navRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const programmaticScrollUntil = useRef<number>(0)

  const updatePill = useCallback((targetId: SectionId) => {
    const el = itemRefs.current[targetId]
    if (!el) return
    setPillStyle({
      x: el.offsetLeft,
      width: el.offsetWidth,
      ready: true,
    })
  }, [])

  useEffect(() => {
    updatePill(activeId)
  }, [activeId, updatePill])

  useEffect(() => {
    let rafId = 0

    const evaluateScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 24)

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0)

      if (Date.now() < programmaticScrollUntil.current) {
        return
      }

      if (scrollY < 90) {
        setActiveId('producto')
        return
      }

      const triggerLine = window.innerHeight * 0.34
      let currentSection: SectionId = 'producto'

      for (const section of NAV_SECTIONS) {
        const element = document.getElementById(section.id)
        if (!element) continue
        const rect = element.getBoundingClientRect()
        if (rect.top <= triggerLine) {
          currentSection = section.id
        }
      }

      // If near the very bottom of the page, highlight the last nav section
      if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 80) {
        currentSection = 'precios'
      }

      setActiveId(currentSection)
    }

    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(evaluateScroll)
    }

    const onResize = () => {
      updatePill(activeId)
      evaluateScroll()
    }

    evaluateScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [activeId, updatePill])

  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const handleSectionClick = (event: React.MouseEvent<HTMLAnchorElement>, id: SectionId) => {
    event.preventDefault()
    const target = document.getElementById(id)
    setMobileOpen(false)

    if (!target) return

    programmaticScrollUntil.current = Date.now() + 850
    setActiveId(id)

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    })

    window.history.replaceState(null, '', id === 'producto' ? '/' : `#${id}`)
  }

  return (
    <header className={`landing-header-wrap${isScrolled ? ' is-scrolled' : ''}`}>
      <div className="landing-shell landing-island">
        <Link
          className="landing-brand"
          href="#producto"
          onClick={(e) => handleSectionClick(e, 'producto')}
          aria-label="CocinaOS, ir al inicio"
        >
          <span className="landing-brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>
            Cocina<span className="landing-brand-os">OS</span>
          </span>
        </Link>

        <nav ref={navRef} className="landing-nav-capsule" aria-label="Secciones de la página">
          <span
            className={`landing-nav-pill${pillStyle.ready ? ' is-ready' : ''}`}
            style={{
              transform: `translate3d(${pillStyle.x}px, 0, 0)`,
              width: `${pillStyle.width}px`,
            }}
            aria-hidden="true"
          />
          {NAV_SECTIONS.map(({ id, label }) => {
            const isActive = activeId === id
            return (
              <a
                key={id}
                ref={(node) => {
                  itemRefs.current[id] = node
                }}
                href={`#${id}`}
                onClick={(e) => handleSectionClick(e, id)}
                className={`landing-nav-link${isActive ? ' is-active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
              >
                {label}
              </a>
            )
          })}
        </nav>

        <div className="landing-header-actions">
          <Link className="landing-app-link" href="/iniciar-sesion">
            Iniciar sesión
          </Link>
          <a className={`${buttonVariants({ size: 'lg' })} landing-cta landing-cta-nav`} href={DEMO_HREF}>
            Solicitar demo
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={1.8} aria-hidden="true" />
          </a>
          <button
            type="button"
            className="landing-mobile-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            aria-label={mobileOpen ? 'Cerrar menú de secciones' : 'Abrir menú de secciones'}
          >
            <HugeiconsIcon icon={mobileOpen ? Cancel01Icon : Menu01Icon} size={20} strokeWidth={1.9} />
          </button>
        </div>

        <span
          className="landing-scroll-progress"
          style={{ transform: `scaleX(${scrollProgress})` }}
          aria-hidden="true"
        />
      </div>

      {mobileOpen && (
        <div className="landing-mobile-backdrop" onClick={() => setMobileOpen(false)}>
          <div
            id="landing-mobile-menu"
            className="landing-shell landing-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Navegación móvil"
          >
            <div className="landing-mobile-links">
              {NAV_SECTIONS.map(({ id, label }) => {
                const isActive = activeId === id
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={(e) => handleSectionClick(e, id)}
                    className={`landing-mobile-link${isActive ? ' is-active' : ''}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span>{label}</span>
                  </a>
                )
              })}
            </div>
            <div className="landing-mobile-footer">
              <Link className="landing-mobile-app" href="/iniciar-sesion" onClick={() => setMobileOpen(false)}>
                Iniciar sesión
              </Link>
              <a className={`${buttonVariants({ size: 'lg' })} landing-cta landing-cta-nav`} href={DEMO_HREF}>
                Solicitar demo
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} strokeWidth={1.8} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
