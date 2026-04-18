"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ImageEntry {
  id: string;
  previewUrl: string;
  storagePath: string | null;
  file: File | null;
  isExisting: boolean;
  isPrimary: boolean;
}

interface Props {
  propertyId?: string;
  initialImages?: {
    id: string;
    storage_path: string;
    is_primary: boolean | null;
    position: number;
  }[];
  onChange: (images: ImageEntry[]) => void;
}

function buildPublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${supabaseUrl}/storage/v1/object/public/property-images/${storagePath}`;
}

export function ImageUploader({ propertyId, initialImages = [], onChange }: Props) {
  const [images, setImages] = useState<ImageEntry[]>(() =>
    [...initialImages]
      .sort((a, b) => a.position - b.position)
      .map((img) => ({
        id: img.id,
        previewUrl: buildPublicUrl(img.storage_path),
        storagePath: img.storage_path,
        file: null,
        isExisting: true,
        isPrimary: img.is_primary ?? false
      }))
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function notify(updated: ImageEntry[]) {
    setImages(updated);
    onChange(updated);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!propertyId) {
      const newEntries: ImageEntry[] = Array.from(files).map((file) => ({
        id: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        storagePath: null,
        file,
        isExisting: false,
        isPrimary: false
      }));
      const updated = [...images, ...newEntries];
      if (updated.length > 0 && !updated.some((i) => i.isPrimary)) {
        updated[0]!.isPrimary = true;
      }
      notify(updated);
      return;
    }

    setUploading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const newEntries: ImageEntry[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${propertyId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("property-images")
        .upload(path, file, { upsert: false });

      if (uploadError) {
        setError(`Error subiendo ${file.name}: ${uploadError.message}`);
        continue;
      }

      newEntries.push({
        id: crypto.randomUUID(),
        previewUrl: buildPublicUrl(path),
        storagePath: path,
        file,
        isExisting: false,
        isPrimary: false
      });
    }

    const updated = [...images, ...newEntries];
    if (updated.length > 0 && !updated.some((i) => i.isPrimary)) {
      updated[0]!.isPrimary = true;
    }
    notify(updated);
    setUploading(false);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const updated = [...images];
    const a = updated[index]!;
    const b = updated[target]!;
    updated[index] = b;
    updated[target] = a;
    notify(updated);
  }

  function remove(index: number) {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some((i) => i.isPrimary)) {
      updated[0]!.isPrimary = true;
    }
    notify(updated);
  }

  function setPrimary(index: number) {
    notify(images.map((img, i) => ({ ...img, isPrimary: i === index })));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img, i) => (
          <div
            key={img.id}
            className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50"
          >
            <div className="relative aspect-video">
              <Image
                src={img.previewUrl}
                alt={`Imagen ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            {img.isPrimary && (
              <span className="absolute top-1 left-1 rounded bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white">
                Principal
              </span>
            )}
            <div className="flex items-center justify-between gap-1 p-1.5">
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  title="Mover izquierda"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  title="Mover derecha"
                >
                  ›
                </button>
              </div>
              <div className="flex gap-1">
                {!img.isPrimary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(i)}
                    className="rounded p-1 text-xs text-blue-600 hover:bg-blue-50"
                    title="Marcar como principal"
                  >
                    ★
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded p-1 text-red-500 hover:bg-red-50"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-video flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-600 disabled:opacity-60"
        >
          <span className="text-2xl">+</span>
          <span>{uploading ? "Subiendo…" : "Agregar imagen"}</span>
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
