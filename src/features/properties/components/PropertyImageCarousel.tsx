"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface ImageItem {
  id: string;
  url: string;
  is_primary: boolean | null;
}

interface Props {
  images: ImageItem[];
}

export function PropertyImageCarousel({ images }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  const primaryIndex = images.findIndex((img) => img.is_primary);
  const mainIndex = primaryIndex >= 0 ? primaryIndex : 0;
  const mainImage = images[mainIndex];

  if (!mainImage) return null;

  function openAt(idx: number) {
    setCurrent(idx);
    setOpen(true);
  }

  return (
    <>
      {/* Main image + count badge */}
      <div
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 cursor-pointer group"
        onClick={() => openAt(mainIndex)}
        role="button"
        aria-label="Ver fotos"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && openAt(mainIndex)}
      >
        <Image
          src={mainImage.url}
          alt="Imagen principal"
          fill
          sizes="(max-width: 768px) 100vw, 800px"
          quality={75}
          priority
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {/* Overlay hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-xs px-2.5 py-1.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="12" height="10" rx="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 16h12M16 7h2" />
            </svg>
            {images.length} fotos
          </div>
        )}
      </div>

      {/* Thumbnail strip (only when > 1) */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => openAt(idx)}
              className={`relative shrink-0 w-16 h-12 rounded-md overflow-hidden bg-slate-100 ring-2 transition-all ${
                idx === mainIndex ? "ring-slate-900" : "ring-transparent hover:ring-slate-300"
              }`}
              aria-label={`Ver foto ${idx + 1}`}
            >
              <Image src={img.url} alt={`Miniatura ${idx + 1}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>

          {/* Counter */}
          <span className="absolute top-4 left-4 text-white/70 text-sm">
            {current + 1} / {images.length}
          </span>

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-3 sm:left-6 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Anterior"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-full max-w-3xl max-h-[80vh] mx-12 sm:mx-20 aspect-[4/3]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[current]!.url}
              alt={`Foto ${current + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 800px"
              quality={85}
              className="object-contain"
            />
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-3 sm:right-6 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Siguiente"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Dot indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-5 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === current ? "bg-white w-3" : "bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Ir a foto ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
