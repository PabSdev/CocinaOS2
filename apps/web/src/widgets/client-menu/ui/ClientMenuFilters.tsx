import { cn } from '@/shared/lib';

export type FilterValue = 'todo' | 'platos' | 'productos' | `cat:${string}`;

export function ClientMenuFilters({ allCount, dishCount, productCount, categories, activeFilter, setActiveFilter, onlyAvailable, setOnlyAvailable }: {
  allCount: number;
  dishCount: number;
  productCount: number;
  categories: { name: string; count: number }[];
  activeFilter: FilterValue;
  setActiveFilter: (value: FilterValue) => void;
  onlyAvailable: boolean;
  setOnlyAvailable: (value: boolean) => void;
}) {
  return (
        <div
          role="toolbar"
          aria-label="Filtrar artículos de la carta"
          className="mt-4 flex flex-col gap-2 rounded-[20px] border border-[#dce3e9] bg-white p-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2.5 sm:p-2.5 sm:px-3.5"
        >
          <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {(
              [
                { value: 'todo', label: 'Todo', count: allCount },
                { value: 'platos', label: 'Platos', count: dishCount },
                { value: 'productos', label: 'Productos', count: productCount },
                ...categories.map(cat => ({
                  value: `cat:${cat.name}` as FilterValue,
                  label: cat.name,
                  count: cat.count,
                })),
              ] as const
            ).map(option => {
              const isActive = activeFilter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(option.value)}
                  className={cn(
                    'inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#112747]',
                    isActive
                      ? 'bg-[#112747] text-white'
                      : 'bg-[#f7f8f7] text-[#142238] hover:bg-[#eff4f8]'
                  )}
                >
                  <span>{option.label}</span>
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      isActive ? 'text-white/75' : 'text-[#55667e]'
                    )}
                  >
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            aria-pressed={onlyAvailable}
            onClick={() => setOnlyAvailable(!onlyAvailable)}
            className={cn(
              'inline-flex min-h-10 w-full shrink-0 items-center justify-center rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#112747] sm:w-auto',
              onlyAvailable
                ? 'border-[#26592b]/25 bg-[#edf3ec] text-[#26592b]'
                : 'border-[#dce3e9] bg-white text-[#55667e] hover:bg-[#eff4f8] hover:text-[#112747]'
            )}
          >
            Solo disponibles
          </button>
        </div>
  );
}
