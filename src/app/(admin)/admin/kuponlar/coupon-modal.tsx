"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CouponFormState, randomCode } from "./promotion-form";
import { Message } from "./promotion-types";
import {
  AffixInput,
  Alert,
  DateRange,
  Field,
  Modal,
  Switch,
} from "./promotion-ui";

export function CouponModal({
  open,
  form,
  pending,
  message,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  form: CouponFormState;
  pending: boolean;
  message: Message;
  onClose: () => void;
  onChange: <K extends keyof CouponFormState>(
    key: K,
    value: CouponFormState[K],
  ) => void;
  onSave: () => void;
}) {
  const percent = form.type === "PERCENT";
  return (
    <Modal
      open={open}
      title={form.id ? "Kuponu düzenle" : "Yeni kupon"}
      description="Müşterinin sepette veya ödemede gireceği indirim kodu"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending || !form.code.trim() || !form.value.trim()}
            onClick={onSave}
          >
            {pending
              ? "Kaydediliyor…"
              : form.id
                ? "Değişiklikleri kaydet"
                : "Kuponu oluştur"}
          </Button>
        </>
      }
    >
      <Alert message={message} />

      <Field
        label="Kupon kodu"
        required
        hint="3–40 karakter; harf, rakam, - ve _"
        action={
          <button
            type="button"
            onClick={() => onChange("code", randomCode())}
            className="cursor-pointer text-[11px] font-medium text-primary hover:underline"
          >
            Rastgele üret
          </button>
        }
      >
        <Input
          value={form.code}
          onChange={(e) => onChange("code", e.target.value.toUpperCase())}
          placeholder="Örn. KAPLAN20"
          className="font-mono font-semibold tracking-wider uppercase"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
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
            placeholder={percent ? "20" : "50"}
          />
        </Field>
      </div>

      <Field label="Minimum sepet tutarı" hint="Boşsa her sepette geçerli">
        <AffixInput
          affix="₺"
          value={form.minSubtotal}
          onChange={(e) => onChange("minSubtotal", e.target.value)}
          inputMode="decimal"
          placeholder="Örn. 250"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Toplam kullanım kotası" hint="Boşsa sınırsız">
          <Input
            value={form.maxUses}
            onChange={(e) => onChange("maxUses", e.target.value)}
            inputMode="numeric"
            placeholder="Örn. 100"
          />
        </Field>
        <Field label="Müşteri başına" hint="Boşsa sınırsız">
          <Input
            value={form.perCustomerLimit}
            onChange={(e) => onChange("perCustomerLimit", e.target.value)}
            inputMode="numeric"
            placeholder="Örn. 1"
          />
        </Field>
      </div>

      <DateRange
        startsAt={form.startsAt}
        endsAt={form.endsAt}
        onStart={(v) => onChange("startsAt", v)}
        onEnd={(v) => onChange("endsAt", v)}
      />

      <Switch
        checked={form.isActive}
        onChange={(v) => onChange("isActive", v)}
        label="Kupon kullanıma açık"
        description={
          form.isActive
            ? "Geçerlilik tarihleri içinde müşteri kullanabilir"
            : "Kapalıyken kod hiçbir koşulda kabul edilmez"
        }
      />
    </Modal>
  );
}
