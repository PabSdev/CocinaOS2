import type { ReactNode } from 'react';

interface RecipeSheetProfitabilityCardProps {
  cost?: number | null;
  partial?: boolean;
  impact?: unknown;
  children: ReactNode;
}

export function RecipeSheetProfitabilityCard({ children }: RecipeSheetProfitabilityCardProps) {
  return (
    <aside
      aria-label="Food Cost objetivo y métricas de ración"
      className="min-w-0 space-y-3.5 @min-[62rem]/escandallo:sticky @min-[62rem]/escandallo:top-4"
    >
      {children}
    </aside>
  );
}
