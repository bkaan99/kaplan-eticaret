"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ImageRow } from "./use-product-form";

interface ProductMediaSectionProps {
  images: ImageRow[];
  setImages: React.Dispatch<React.SetStateAction<ImageRow[]>>;
  uploadImage: (file: File, index: number) => Promise<void>;
  uploadError: string | null;
  imageOptionChoices: { key: string; label: string }[];
  fieldErrors: Record<string, string>;
}

export function ProductMediaSection({
  images,
  setImages,
  uploadImage,
  uploadError,
  imageOptionChoices,
  fieldErrors,
}: ProductMediaSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Görseller</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Görsel yükleyin (JPEG, PNG, WebP, GIF — en fazla 5 MB) veya adres
          girin (https://… veya /yol). Bir seçenek seçerseniz görsel yalnızca
          o seçenek (örn. renk) seçilince gösterilir.
        </p>
        {uploadError ? (
          <p role="alert" className="text-sm text-red-600">
            {uploadError}
          </p>
        ) : null}
        {images.map((image, index) => (
          <div
            key={index}
            className="grid gap-2 sm:grid-cols-[1fr_1fr_200px_auto]"
          >
            <div className="flex flex-col gap-1">
              <Input
                value={image.url}
                placeholder="Görsel adresi"
                aria-label="Görsel adresi"
                onChange={(e) =>
                  setImages((rows) =>
                    rows.map((r, i) =>
                      i === index ? { ...r, url: e.target.value } : r,
                    ),
                  )
                }
              />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                aria-label="Dosyadan yükle"
                className="text-xs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadImage(file, index);
                  e.target.value = "";
                }}
              />
            </div>
            <Input
              value={image.alt}
              placeholder="Alternatif metin"
              aria-label="Alternatif metin"
              onChange={(e) =>
                setImages((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, alt: e.target.value } : r,
                  ),
                )
              }
            />
            <Select
              value={image.forOption}
              aria-label="Seçeneğe özel"
              onChange={(e) =>
                setImages((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, forOption: e.target.value } : r,
                  ),
                )
              }
            >
              <option value="">Tüm seçenekler</option>
              {imageOptionChoices.map((choice) => (
                <option key={choice.key} value={choice.key}>
                  {choice.label}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setImages((rows) => rows.filter((_, i) => i !== index))
              }
            >
              Kaldır
            </Button>
            {fieldErrors[`images.${index}.url`] ? (
              <span className="text-xs text-red-600 sm:col-span-4">
                {fieldErrors[`images.${index}.url`]}
              </span>
            ) : null}
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setImages((rows) => [
                ...rows,
                { url: "", alt: "", forOption: "" },
              ])
            }
          >
            Görsel ekle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
