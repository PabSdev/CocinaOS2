import type { IconSvgElement } from '@hugeicons/react'

export interface NavItem {
  id: string
  label: string
  href: string
  icon: IconSvgElement
  badge?: string | number
  badgeVariant?: 'default' | 'accent' | 'muted' | 'warning'
  adminOnly?: boolean
  disabled?: boolean
  description?: string
}

export interface NavSection {
  title?: string
  items: NavItem[]
}
