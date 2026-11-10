"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/shared/cn";
import { CampaignFormState } from "./promotion-form";
import { Category, Message } from "./promotion-types";
import {
  AffixInput,
  Alert,
  DateRange,
  Field,
  Modal,
  Switch,
} from "./promotion-ui";

export function CampaignModal({
  open,
  form,
  pending,
  message,
  categories,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  form: CampaignFormState;
  pending: boolean;
  message: Message;
  categories: Category[];
  onClose: () => void;
  onChange: <K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) => void;
  onSave: () => void;
}) {
  const percent = form.type === "PERCENT";
  return (
    <Modal
      open={open}
      title={form.id ? "Kampanyayı düzenle" : "Yeni otomatik kampanya"}
      description="Kod gerekmeden, koşul sağlandığında sepete kendiliğinden uygulanır"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending || !form.name.trim() || !form.value.trim()}
            onClick={onSave}
          >
            {pending
              ? "Kaydediliyor…"
              : form.id
                ? "Değişiklikleri kaydet"
                : "Kampanyayı oluştur"}
          </Button>
        </>
      }
    >
      <Alert message={message} />

      <Field label="Kampanya adı" required hint="Müşteri sepette bu adı görür">
        <Input
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Örn. 500 TL üzeri %10 indirim"
        />
      </Field>

      <Field label="Kural">
        <Select
          value={form.ruleType}
          onChange={(e) => onChange("ruleType", e.target.value)}
        >
          <option value="cart-threshold">
            Sepet tutarı belirli bir limiti geçince
          </option>
          <option value="category">Seçili kategorilerdeki ürünlere</option>
        </Select>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="İndirim türü">
          <Select
            value={form.type}
            onChange={(e) => onChange("type", e.target.value)}
          >
            <option value="PERCENT">Yüzde (%)</option>
            <option value="FIXED">Sabit tutar (₺)</option>
          </Select>
        </Field>
        <Field label={percent ? "İndirim oranı" : "İndirim tutarı"} required>
          <AffixInput
            affix={percent ? "%" : "₺"}
            value={form.value}
            onChange={(e) => onChange("value", e.target.value)}
            inputMode="decimal"
            placeholder="10"
          />
        </Field>
      </div>

      {form.ruleType === "cart-threshold" ? (
        <Field label="Minimum sepet tutarı">
          <AffixInput
            affix="₺"
            value={form.minSubtotal}
            onChange={(e) => onChange("minSubtotal", e.target.value)}
            inputMode="decimal"
            placeholder="Örn. 500"
          />
        </Field>
      ) : (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[12px] font-medium text-slate-700">
            Geçerli kategoriler
            <span className="ml-1.5 font-normal text-slate-400">
              {form.categoryIds.length} seçili
            </span>
          </legend>
          <div className="grid max-h-44 gap-0.5 overflow-y-auto rounded-lg border border-slate-200 p-1.5 sm:grid-cols-2">
            {categories.map((category) => {
              const checked = form.categoryIds.includes(category.id);
              return (
                <label
                  key={category.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors",
                    checked
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange(
                        "categoryIds",
                        checked
                          ? form.categoryIds.filter((id) => id !== category.id)
                          : [...form.categoryIds, category.id],
                      )
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-primary"
                  />
                  <span className="truncate">{category.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <Field
        label="Öncelik"
        hint="Birden fazla kampanya uygunsa yüksek öncelikli olan önce uygulanır"
      >
        <Input
          value={form.priority}
          onChange={(e) => onChange("priority", e.target.value)}
          inputMode="numeric"
          placeholder="0"
          className="w-28"
        />
      </Field>

      <DateRange
        startsAt={form.startsAt}
        endsAt={form.endsAt}
        onStart={(v) => onChange("startsAt", v)}
        onEnd={(v) => onChange("endsAt", v)}
      />

      <Switch
        checked={form.isActive}
        onChange={(v) => onChange("isActive", v)}
        label="Kampanya devrede"
        description={
          form.isActive
            ? "Geçerlilik tarihleri içinde sepetlere otomatik uygulanır"
            : "Kapalıyken hiçbir sepete uygulanmaz"
        }
      />
    </Modal>
  );
}
