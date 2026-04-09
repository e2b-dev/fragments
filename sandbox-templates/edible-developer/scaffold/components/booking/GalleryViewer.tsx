import { useState } from 'react'

interface GalleryViewerProps {
  images: { url: string; alt: string }[]
}

export function GalleryViewer({ images }: GalleryViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (images.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="aspect-[16/9] rounded-xl overflow-hidden">
        <img
          src={images[activeIndex].url}
          alt={images[activeIndex].alt}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                index === activeIndex ? 'border-primary' : 'border-transparent'
              }`}
            >
              <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
