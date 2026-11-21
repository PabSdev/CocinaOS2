import { buttonVariants } from '@/shared/ui';
import { ArrowRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

export const demoHref = 'mailto:prueba@gmail.com?subject=Solicitud%20de%20demo%20de%20CocinaOS';

export const items = [
  ['Tomate triturado', '8,4 kg', '2,80 €/kg', 'Correcto'],
  ['Mozzarella fresca', '3,2 kg', '7,40 €/kg', 'Correcto'],
  ['Harina de fuerza', '18,5 kg', '1,25 €/kg', 'Correcto'],
  ['Aceite de oliva virgen', '7,1 L', '8,90 €/L', 'Correcto'],
  ['Albahaca fresca', '0,4 kg', '12,00 €/kg', 'Stock bajo'],
] as const;

export const staggerStyle = (index: number): CSSProperties =>
  ({ '--stagger': index }) as CSSProperties;

export const Icon = ({ icon, size = 18 }: { icon: typeof ArrowRight01Icon; size?: number }) => (
  <HugeiconsIcon icon={icon} size={size} strokeWidth={1.8} aria-hidden="true" />
);

export function Brand() {
  return (
    <Link className="landing-brand" href="/" aria-label="CocinaOS, inicio">
      <span className="landing-brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        Cocina<span className="landing-brand-os">OS</span>
      </span>
    </Link>
  );
}

export function Cta({ children = 'Solicitar demo' }: { children?: ReactNode }) {
  return (
    <a className={`${buttonVariants({ size: 'lg' })} landing-cta`} href={demoHref}>
      {children}
      <Icon icon={ArrowUpRight01Icon} size={16} />
    </a>
  );
}

export function StatusBadge({ low = false }: { low?: boolean }) {
  return (
    <span className={`landing-badge ${low ? 'landing-badge-amber' : 'landing-badge-green'}`}>
      {low ? 'Stock bajo' : 'Correcto'}
    </span>
  );
}
