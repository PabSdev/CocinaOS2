import { Skeleton } from '@/shared/ui'

export function PedidosLoading() {
  return (
    <div className="space-y-6 md:space-y-8" role="status" aria-label="Cargando pedidos">
      <div className="max-w-2xl">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="mt-3 h-10 w-64 rounded-xl" />
        <Skeleton className="mt-2.5 h-4 w-full max-w-md rounded-lg" />
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-[20px] border border-[#dce3e9] bg-white p-5 shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]"
            >
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-9 w-20 rounded-lg" />
              <Skeleton className="mt-2 h-3 w-36 rounded-md" />
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-[20px] border border-[#cbd7e3] bg-white shadow-[0_14px_36px_-24px_rgba(17,39,71,0.14)]">
          <div className="space-y-4 border-b border-[#dce3e9] bg-[#eff4f8]/65 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-3.5 w-64 rounded-md" />
              </div>
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Skeleton className="h-9 w-80 rounded-full" />
              <Skeleton className="h-9 w-52 rounded-full" />
            </div>
          </div>

          <div className="divide-y divide-[#edf1f5] px-4 sm:px-6">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="flex h-14 items-center justify-between gap-6">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Cargando pedidos...</span>
    </div>
  )
}

