'use client'

import * as React from 'react'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Dish01Icon } from '@hugeicons/core-free-icons'

interface DishThumbnailProps {
  fotoId: string | null | undefined
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function DishThumbnail({
  fotoId,
  alt,
  size = 'md',
  className = '',
}: DishThumbnailProps) {
  const [hasError, setHasError] = useState(false)

  const sizeClasses = {
    sm: 'size-10 rounded-xl',
    md: 'size-12 rounded-xl',
    lg: 'size-20 rounded-2xl',
  }[size]

  const iconSizes = {
    sm: 'size-4.5',
    md: 'size-5.5',
    lg: 'size-9',
  }[size]

  if (fotoId && !hasError) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-[#dce3e9] bg-[#eff4f8] shadow-2xs ${sizeClasses} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/storage/dishes/${fotoId}`}
          alt={alt}
          loading="lazy"
          onError={() => setHasError(true)}
          className="size-full object-cover object-center"
        />
      </div>
    )
  }

  return (
    <div
      aria-label={`Sin foto: ${alt}`}
      className={`flex shrink-0 items-center justify-center border border-[#e1e9f0] bg-[#eff4f8] text-[#55667e] ${sizeClasses} ${className}`}
    >
      <HugeiconsIcon icon={Dish01Icon} className={iconSizes} strokeWidth={1.8} />
    </div>
  )
}
