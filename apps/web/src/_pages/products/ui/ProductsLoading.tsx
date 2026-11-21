import { Skeleton } from '@/shared/ui'

export function ProductsLoading() {
  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="space-y-2.5">
        <Skeleton className="h-6 w-36 rounded-full bg-[#e8eef4]" />
        <Skeleton className="h-8 w-64 rounded-xl bg-[#e8eef4]" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg bg-[#e8eef4]" />
      </div>

      {/* 3 Tarjetas Isla de Métricas */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-[20px] border border-[#dce3e9] bg-white p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 rounded-md bg-[#eff4f8]" />
              <Skeleton className="h-5 w-20 rounded-full bg-[#eff4f8]" />
            </div>
            <Skeleton className="mt-3 h-8 w-16 rounded-lg bg-[#e8eef4]" />
            <Skeleton className="mt-2 h-3.5 w-44 rounded-md bg-[#eff4f8]" />
          </div>
        ))}
      </div>

      {/* Contenedor Isla de la Tabla */}
      <div className="overflow-hidden rounded-[20px] border border-[#cbd7e3] bg-white shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
        <div className="space-y-4 border-b border-[#e5ebf1] bg-[#eff4f8]/65 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44 rounded-md bg-white" />
              <Skeleton className="h-3.5 w-52 rounded-md bg-white/80" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-full bg-white" />
              <Skeleton className="h-9 w-36 rounded-full bg-[#112747]/20" />
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Skeleton className="h-10 w-full rounded-full bg-white lg:max-w-sm" />
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-72 rounded-full bg-white" />
              <Skeleton className="h-9 w-32 rounded-full bg-white" />
            </div>
          </div>
        </div>

        <div className="divide-y divide-[#edf1f5] px-5 sm:px-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-4 py-3.5">
              <div className="flex items-center gap-3.5">
                <Skeleton className="size-12 shrink-0 rounded-xl bg-[#eff4f8]" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-44 rounded-md bg-[#e8eef4]" />
                  <Skeleton className="h-3 w-28 rounded-md bg-[#eff4f8] sm:hidden" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="hidden h-6 w-20 rounded-full bg-[#e1f3fe] sm:block" />
                <Skeleton className="hidden h-6 w-16 rounded-full bg-[#eff4f8] sm:block" />
                <Skeleton className="h-6 w-20 rounded-full bg-[#eff4f8]" />
                <Skeleton className="size-9 rounded-full bg-[#eff4f8]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
