'use client'

import * as React from 'react'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PackageIcon } from '@hugeicons/core-free-icons'

interface ProductThumbnailProps {
  fotoId: string | null | undefined
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ProductThumbnail({
  fotoId,
  alt,
  size = 'md',
  className = '',
}: ProductThumbnailProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  const trimmedFoto = fotoId?.trim()
  const imageSrc = trimmedFoto
    ? trimmedFoto.startsWith('http://') ||
      trimmedFoto.startsWith('https://') ||
      (trimmedFoto.startsWith('/') && !trimmedFoto.startsWith('//'))
      ? trimmedFoto
      : `/api/storage/dishes/${trimmedFoto}`
    : null

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

  if (imageSrc && failedSrc !== imageSrc) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden border border-[#dce3e9] bg-[#eff4f8] shadow-2xs ${sizeClasses} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          onError={() => setFailedSrc(imageSrc)}
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
      <HugeiconsIcon icon={PackageIcon} className={iconSizes} strokeWidth={1.8} />
    </div>
  )
}
