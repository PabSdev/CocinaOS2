'use client'

import { useEffect } from 'react'

export function ScrollAnimator() {
  useEffect(() => {
    const root = document.querySelector('.landing')
    if (!root) return

    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (targets.length === 0) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add('is-visible'))
      return
    }

    root.classList.add('has-scroll-anim')

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px',
      }
    )

    targets.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      root.classList.remove('has-scroll-anim')
    }
  }, [])

  return null
}
