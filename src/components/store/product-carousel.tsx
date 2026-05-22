'use client';

import { useState } from "react";
import Image from "next/image";

import { cn, isUploadedProductImageUrl } from "@/lib/utils";

export function ProductCarousel({
  images,
  productName,
}: {
  images: Array<{
    imageUrl: string;
    altText: string | null;
    id: string;
  }>;
  productName: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex];

  return (
    <div className="space-y-4">
      <div className="glass-card relative overflow-hidden rounded-[36px] p-4">
        <div className="mesh-accent absolute inset-0 opacity-[0.07]" />
        <div className="relative aspect-square overflow-hidden rounded-[28px] bg-white">
          {currentImage ? (
            <Image
              src={currentImage.imageUrl}
              alt={currentImage.altText ?? productName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              unoptimized={isUploadedProductImageUrl(currentImage.imageUrl)}
            />
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "glass-card relative aspect-square overflow-hidden rounded-2xl border p-1",
              currentIndex === index
                ? "border-[rgba(244,71,161,0.5)]"
                : "border-transparent",
            )}
          >
            <Image
              src={image.imageUrl}
              alt={image.altText ?? `${productName} ${index + 1}`}
              fill
              className="rounded-[14px] object-cover"
              sizes="120px"
              unoptimized={isUploadedProductImageUrl(image.imageUrl)}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
