"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./product-form-field";

interface ProductSeoSectionProps {
  seoTitle: string;
  setSeoTitle: (v: string) => void;
  seoDescription: string;
  setSeoDescription: (v: string) => void;
  fieldErrors: Record<string, string>;
}

export function ProductSeoSection({
  seoTitle,
  setSeoTitle,
  seoDescription,
  setSeoDescription,
  fieldErrors,
}: ProductSeoSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">
            Arama Motoru Optimizasyonu (SEO)
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Google ve diğer arama motorlarında ürünün nasıl görüneceğini belirleyin
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5">
        {/* Google Önizleme Kartı */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Google Arama Önizlemesi
          </span>
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="h-4 w-4 rounded-full bg-slate-100 text-center leading-4 text-[10px]">🌐</span>
              <span className="truncate">kaplantursu.com › urunler</span>
            </div>
            <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer truncate">
              {seoTitle || "Ürün Başlığı | Kaplan Gurme Turşuları"}
            </h4>
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {seoDescription ||
                "Doğal fermantasyon yöntemiyle üretilen katkısız ve probiyotik ev tipi turşular. Kaplan güvencesiyle kapınıza teslim."}
            </p>
          </div>
        </div>

        {/* Alanlar */}
        <Field
          label="SEO Başlığı"
          hint={`${seoTitle.length} / 70 karakter`}
          error={fieldErrors["seoTitle"]}
        >
          <Input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            maxLength={70}
            placeholder="Örn: 5 kg Doğal Çubuk Turşusu | Kaplan Gurme"
            className="h-9.5 text-xs font-medium"
          />
        </Field>

        <Field
          label="SEO Açıklaması (Meta Description)"
          hint={`${seoDescription.length} / 160 karakter`}
          error={fieldErrors["seoDescription"]}
        >
          <Textarea
            rows={3}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            maxLength={160}
            placeholder="Arama motorlarında başlığın altında çıkacak kısa ve çekici tanıtım metni..."
            className="text-xs leading-relaxed"
          />
        </Field>
      </CardContent>
    </Card>
  );
}
