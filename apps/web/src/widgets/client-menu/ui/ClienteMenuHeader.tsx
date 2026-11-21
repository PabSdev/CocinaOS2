import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Cancel01Icon, PackageIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { LogoutButton } from '@/features/auth';
import { CartContent, useClientCart } from '@/features/client-cart';
import { cn } from '@/shared/lib';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Input } from '@/shared/ui';
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

const priceFormatter = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

function getInitials(name?: string) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}


export function ClienteMenuHeader({ search, setSearch, user, cart, cartOpen, setCartOpen }: {
  search: string;
  setSearch: (value: string) => void;
  user?: { name?: string; email?: string };
  cart: ReturnType<typeof useClientCart>;
  cartOpen: boolean;
  setCartOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasSearchQuery = search.length > 0;
  const hasActiveSearch = Boolean(search.trim());

  useEffect(() => {
    if (!mobileSearchOpen) return;
    searchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!cartOpen && !mobileSearchOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (cartOpen) {
        event.preventDefault();
        setCartOpen(false);
        triggerRef.current?.focus();
      } else if (mobileSearchOpen) {
        event.preventDefault();
        setMobileSearchOpen(false);
        searchTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [cartOpen, mobileSearchOpen, setCartOpen]);

  return (
      <header className="sticky top-0 z-40 border-b border-[#dce3e9]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-white/95 backdrop-blur-md"
        />
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2.5 px-4 py-2.5 sm:gap-6 sm:px-6 sm:py-3">
          <Link
            href="/clientes"
            className={cn(
              'group order-1 flex shrink-0 items-center gap-2.5 rounded-full py-1 pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#112747]',
              mobileSearchOpen && 'hidden sm:flex'
            )}
            aria-label="CocinaOS, inicio de clientes"
          >
            <span
              className="flex size-7 shrink-0 items-end gap-[3px] rounded-[7px] border-[1.5px] border-[#112747] p-[5px] text-[#112747] -rotate-6 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105"
              aria-hidden="true"
            >
              <span className="h-[9px] w-1 rounded-[1px] bg-current" />
              <span className="h-4 w-1 rounded-[1px] bg-current" />
              <span className="h-1.5 w-1 rounded-[1px] bg-current" />
            </span>
            <span className="text-[19px] font-bold leading-none tracking-[-0.045em] text-[#112747]">
              Cocina<span className="font-normal">OS</span>
            </span>
          </Link>

          <div
            className={cn(
              mobileSearchOpen
                ? 'order-2 flex flex-1 items-center gap-2 sm:mx-auto sm:max-w-xl'
                : 'hidden sm:order-2 sm:mx-auto sm:block sm:max-w-xl sm:flex-1'
            )}
          >
            <label htmlFor="buscar-carta" className="sr-only">Buscar en la carta</label>
            <div className="relative flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#55667e]"
                strokeWidth={1.8}
              />
              <Input
                ref={searchInputRef}
                id="buscar-carta"
                type="search"
                placeholder="Buscar platos y productos..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                className={cn(
                  'h-11 rounded-full border-[#dce3e9] bg-[#f7f8f7] pl-10 text-sm text-[#142238] placeholder:text-[#55667e] focus-visible:bg-white [&::-webkit-search-cancel-button]:hidden',
                  hasSearchQuery ? 'pr-10' : 'pr-4'
                )}
              />
              {hasSearchQuery && (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  onClick={() => {
                    setSearch('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[#55667e] transition-colors hover:bg-[#eff4f8] hover:text-[#112747] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#112747]"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={15} strokeWidth={2} />
                </button>
              )}
            </div>
            {mobileSearchOpen && (
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  searchTriggerRef.current?.focus();
                }}
                className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold text-[#112747] transition-colors hover:bg-[#eff4f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#112747] sm:hidden"
              >
                Cancelar
              </button>
            )}
          </div>

          <div
            className={cn(
              'order-2 flex shrink-0 items-center gap-1.5 sm:order-3 sm:gap-2.5',
              mobileSearchOpen && 'hidden sm:flex'
            )}
          >
            <Button
              ref={searchTriggerRef}
              variant="outline"
              size="icon"
              aria-label="Abrir buscador"
              aria-expanded={mobileSearchOpen}
              aria-controls="buscar-carta"
              onClick={() => {
                setCartOpen(false);
                setMobileSearchOpen(true);
              }}
              className="relative size-11 rounded-full border-[#dce3e9] bg-white text-[#112747] shadow-xs hover:bg-[#eff4f8] sm:hidden"
            >
              <HugeiconsIcon icon={Search01Icon} size={18} strokeWidth={1.9} />
              {hasActiveSearch && (
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#112747]"
                />
              )}
            </Button>

            <div className="relative">
              <Button
                ref={triggerRef}
                variant="outline"
                className={cn(
                  'min-h-11 rounded-full border px-3 py-2 text-sm font-semibold shadow-xs transition-colors sm:px-4',
                  cart.count > 0
                    ? 'border-[#112747] bg-[#112747] text-white hover:bg-[#1a3860] hover:text-white'
                    : 'border-[#dce3e9] bg-white text-[#112747] hover:bg-[#eff4f8]'
                )}
                aria-expanded={cartOpen}
                aria-controls="panel-carrito"
                aria-label={`Carrito (${cart.count}) · ${priceFormatter.format(cart.total / 100)}`}
                onClick={() => setCartOpen(open => !open)}
              >
                <HugeiconsIcon icon={PackageIcon} data-icon="inline-start" strokeWidth={1.8} className="size-4" />
                <span className="hidden md:inline">Carrito</span>
                <span aria-live="polite" className="tabular-nums">
                  ({cart.count})
                  <span className="hidden sm:inline"> · {priceFormatter.format(cart.total / 100)}</span>
                </span>
              </Button>

              {cartOpen && (
                <>
                  <div
                    aria-hidden="true"
                    data-testid="cart-backdrop"
                    className="fixed inset-0 z-40 bg-[#112747]/30 sm:hidden"
                    onClick={() => setCartOpen(false)}
                  />
                  <div
                    id="panel-carrito"
                    role="dialog"
                    aria-modal="false"
                    aria-label="Tu carrito"
                    className={cn(
                      'z-50 flex flex-col border border-[#dce3e9] bg-white shadow-[0_16px_40px_-12px_rgba(17,39,71,0.18)] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150',
                      'fixed inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[20px] rounded-b-none border-b-0',
                      'sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.625rem)] sm:bottom-auto sm:max-h-none sm:w-[min(24rem,calc(100vw-2rem))] sm:rounded-[20px] sm:border-b'
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[#dce3e9] sm:hidden"
                    />
                    <div className="flex items-center justify-between border-b border-[#dce3e9] px-5 py-3.5 sm:py-4">
                      <div>
                        <h2 className="text-base font-bold text-[#112747]">Tu carrito</h2>
                        <p className="text-xs text-[#55667e]">
                          {cart.count === 1 ? '1 artículo seleccionado' : `${cart.count} artículos seleccionados`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-full text-[#55667e] hover:bg-[#eff4f8] hover:text-[#112747]"
                        aria-label="Cerrar carrito"
                        onClick={() => {
                          setCartOpen(false);
                          triggerRef.current?.focus();
                        }}
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
                      </Button>
                    </div>
                    <CartContent cart={cart} />
                  </div>
                </>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Menú de perfil"
                render={
                  <Button
                    variant="outline"
                    className="min-h-11 gap-2 rounded-full border-[#dce3e9] bg-white pl-1.5 pr-3 text-[#112747] shadow-xs hover:bg-[#eff4f8]"
                  />
                }
              >
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-[#112747] text-xs font-bold text-white"
                >
                  {getInitials(user?.name)}
                </span>
                {user?.name && (
                  <span className="hidden max-w-28 truncate text-sm font-semibold md:inline">
                    {user.name.split(' ')[0]}
                  </span>
                )}
                <HugeiconsIcon icon={ArrowDown01Icon} size={15} strokeWidth={2} className="text-[#55667e]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-64 rounded-[20px] border border-[#dce3e9] bg-white p-2 shadow-[0_16px_40px_-12px_rgba(17,39,71,0.18)] ring-0"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-[#112747]">
                        {user?.name || 'Cliente'}
                      </span>
                      {user?.email && (
                        <span className="truncate text-xs font-normal text-[#55667e]">
                          {user.email}
                        </span>
                      )}
                      <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-[#eff4f8] px-2.5 py-0.5 text-[11px] font-semibold text-[#112747]">
                        Cuenta de cliente
                      </span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="my-1 bg-[#dce3e9]" />
                <div className="p-1">
                  <LogoutButton
                    showText
                    className="flex min-h-10 w-full items-center gap-2.5 rounded-[12px] px-3 py-2 text-sm font-semibold text-[#962b29] transition-colors hover:bg-[#fdebec] disabled:opacity-50"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
  );
}
