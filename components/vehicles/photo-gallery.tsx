'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PhotoGalleryProps {
  images: string[]
  alt: string
}

export function PhotoGallery({ images, alt }: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const validImages = images.filter(Boolean)
  if (validImages.length === 0) {
    validImages.push('/placeholder-car.jpg')
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1))
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2">
        {/* Main Image */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="relative aspect-[4/3] overflow-hidden rounded-l-xl md:col-span-2 md:row-span-2"
        >
          <Image
            src={validImages[0]}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover transition-transform hover:scale-105"
            priority
          />
        </button>

        {/* Thumbnail Grid */}
        {validImages.slice(1, 5).map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index + 1)
              setLightboxOpen(true)
            }}
            className={cn(
              'relative hidden aspect-[4/3] overflow-hidden md:block',
              index === 1 && 'rounded-tr-xl',
              index === 3 && 'rounded-br-xl'
            )}
          >
            <Image
              src={image}
              alt={`${alt} - Photo ${index + 2}`}
              fill
              sizes="(max-width: 768px) 50vw, 17vw"
              className="object-cover transition-transform hover:scale-105"
            />
            {index === 3 && validImages.length > 5 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                <span className="text-lg font-semibold">+{validImages.length - 5} more</span>
              </div>
            )}
          </button>
        ))}

        {/* Mobile: Show all button */}
        {validImages.length > 1 && (
          <Button
            variant="secondary"
            className="absolute bottom-4 right-4 md:hidden"
            onClick={() => setLightboxOpen(true)}
          >
            View all {validImages.length} photos
          </Button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          >
            <X className="size-6" />
          </button>

          <button
            onClick={goToPrevious}
            className="absolute left-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          >
            <ChevronLeft className="size-8" />
          </button>

          <div className="relative h-[80vh] w-[90vw] max-w-5xl">
            <Image
              src={validImages[currentIndex]}
              alt={`${alt} - Photo ${currentIndex + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>

          <button
            onClick={goToNext}
            className="absolute right-4 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          >
            <ChevronRight className="size-8" />
          </button>

          {/* Thumbnail strip */}
          <div className="absolute bottom-4 flex gap-2 overflow-x-auto px-4">
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'relative size-16 shrink-0 overflow-hidden rounded-md border-2 transition-all',
                  currentIndex === index ? 'border-white' : 'border-transparent opacity-60'
                )}
              >
                <Image
                  src={image}
                  alt={`${alt} - Thumbnail ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Counter */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
            {currentIndex + 1} / {validImages.length}
          </div>
        </div>
      )}
    </>
  )
}
