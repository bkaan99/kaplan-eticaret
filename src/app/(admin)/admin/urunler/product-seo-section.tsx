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
      <CardHeader>
        <CardTitle>Arama motoru (SEO)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Field
          label="SEO başlığı (en çok 70)"
          error={fieldErrors["seoTitle"]}
        >
          <Input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            maxLength={70}
          />
        </Field>
        <Field
          label="SEO açıklaması (en çok 160)"
          error={fieldErrors["seoDescription"]}
        >
          <Textarea
            rows={2}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            maxLength={160}
          />
        </Field>
      </CardContent>
    </Card>
  );
}
