"use client";

import Image from "next/image";
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
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">
            Ürün & Bidon Görselleri
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Müşterinin göreceği kapak ve galeri görselleri (JPEG, PNG, WebP — en fazla 5 MB)
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
          {images.length} Görsel
        </span>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {uploadError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            ⚠️ {uploadError}
          </div>
        )}

        {images.length > 0 ? (
          <div className="space-y-3">
            {images.map((image, index) => {
              const hasValidUrl = Boolean(
                image.url && (image.url.startsWith("http") || image.url.startsWith("/")),
              );

              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition sm:flex-row sm:items-center"
                >
                  {/* Görsel Önizleme Kutusu */}
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                    {hasValidUrl ? (
                      <Image
                        src={image.url}
                        alt={image.alt || "Önizleme"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-2xl text-slate-300">🖼️</span>
                    )}
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-slate-900/80 px-1 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur-xs">
                        Kapak
                      </span>
                    )}
                  </div>

                  {/* Giriş Alanları */}
                  <div className="grid flex-1 gap-2.5 sm:grid-cols-[1.5fr_1fr_1fr]">
                    <div className="flex flex-col gap-1">
                      <Input
                        value={image.url}
                        placeholder="Görsel URL'si (/images/... veya https://...)"
                        aria-label="Görsel adresi"
                        className="h-8.5 text-xs font-mono"
                        onChange={(e) =>
                          setImages((rows) =>
                            rows.map((r, i) =>
                              i === index ? { ...r, url: e.target.value } : r,
                            ),
                          )
                        }
                      />
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer">
                        <span>📤 Dosyadan Yükle</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadImage(file, index);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>

                    <Input
                      value={image.alt}
                      placeholder="Görsel açıklaması (Alt metin)"
                      aria-label="Alternatif metin"
                      className="h-8.5 text-xs"
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
                      className="h-8.5 text-xs"
                      onChange={(e) =>
                        setImages((rows) =>
                          rows.map((r, i) =>
                            i === index ? { ...r, forOption: e.target.value } : r,
                          ),
                        )
                      }
                    >
                      <option value="">Tüm seçenekler için</option>
                      {imageOptionChoices.map((choice) => (
                        <option key={choice.key} value={choice.key}>
                          {choice.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Sil Butonu */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() =>
                      setImages((rows) => rows.filter((_, i) => i !== index))
                    }
                  >
                    Kaldır
                  </Button>

                  {fieldErrors[`images.${index}.url`] && (
                    <span className="text-xs font-semibold text-red-600 sm:col-span-4">
                      {fieldErrors[`images.${index}.url`]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-slate-200 text-center">
            <span className="text-2xl mb-1 text-slate-400">🖼️</span>
            <p className="text-xs font-medium text-slate-500">
              Henüz görsel eklenmemiş
            </p>
          </div>
        )}

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs font-semibold text-slate-700"
            onClick={() =>
              setImages((rows) => [
                ...rows,
                { url: "", alt: "", forOption: "" },
              ])
            }
          >
            + Yeni Görsel Satırı Ekle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
