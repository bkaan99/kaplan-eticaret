"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Button } from "@/components/ui/button";
import { getCroppedImg } from "./get-cropped-img";

export interface ImageCropDialogProps {
  open: boolean;
  /** Object URL veya data URL */
  imageSrc: string | null;
  /** Orijinal dosya adı (çıktı File adı için) */
  fileName: string;
  sourceMime?: string;
  /** Varsayılan 1 (kare) — malzeme kartlarıyla uyumlu */
  aspect?: number;
  title?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export function ImageCropDialog({
  open,
  imageSrc,
  fileName,
  sourceMime,
  aspect = 1,
  title = "Görseli Kırp",
  confirmLabel = "Kırp ve Kullan",
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setBusy(false);
    setError(null);
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, busy, onCancel]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const file = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        fileName,
        sourceMime,
      );
      onConfirm(file);
    } catch {
      setError("Kırpma başarısız oldu, başka bir görsel deneyin");
      setBusy(false);
    }
  }

  if (!open || !imageSrc) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-crop-dialog-title"
      className="fixed inset-0 z-[60] flex items-center justify-center p-1 sm:p-4"
    >
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
        onClick={() => {
          if (!busy) onCancel();
        }}
      />

      <div className="relative z-10 flex max-h-[98vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2
              id="image-crop-dialog-title"
              className="text-base font-bold text-slate-900 sm:text-lg"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Sürükleyerek konumu, kaydırıcıyla yakınlaştırmayı ayarlayın
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="relative h-[min(78vh,820px)] min-h-[480px] w-full bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid
          />
        </div>

        <div className="shrink-0 space-y-3 border-t border-slate-100 px-5 py-4 sm:px-6 sm:py-5">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700 sm:text-sm">
            Yakınlaştır
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-emerald-700"
              disabled={busy}
            />
          </label>

          {error ? (
            <p role="alert" className="text-xs font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={busy}
              className="cursor-pointer"
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={busy || !croppedAreaPixels}
              className="bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer"
            >
              {busy ? "Hazırlanıyor..." : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
