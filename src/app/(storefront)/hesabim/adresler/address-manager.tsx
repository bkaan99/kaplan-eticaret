"use client";

import { useState, useTransition } from "react";
import {
  accountField,
  accountLabel,
  accountPrimaryBtn,
  accountSecondaryBtn,
  accountTextarea,
} from "@/components/storefront/account-ui";
import {
  sanitizeTurkishMobileInput,
  TR_MOBILE_INPUT_MAX_DIGITS,
} from "@/shared/phone/tr-mobile";
import { districtsOf } from "@/shared/geo/turkey-districts";
import { TURKEY_PROVINCES } from "@/shared/geo/turkey-provinces";
import { deleteAddressAction, saveAddressAction } from "../actions";

export interface AddressView {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string | null;
  addressLine: string;
  postalCode: string | null;
  invoiceType: "INDIVIDUAL" | "CORPORATE";
  nationalId: string | null;
  companyName: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

interface FormState {
  id: string | null;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  postalCode: string;
  invoiceType: "INDIVIDUAL" | "CORPORATE";
  nationalId: string;
  companyName: string;
  taxNumber: string;
  taxOffice: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

const blank: FormState = {
  id: null,
  title: "",
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  district: "",
  neighborhood: "",
  addressLine: "",
  postalCode: "",
  invoiceType: "INDIVIDUAL",
  nationalId: "",
  companyName: "",
  taxNumber: "",
  taxOffice: "",
  isDefaultShipping: false,
  isDefaultBilling: false,
};

function toForm(address: AddressView): FormState {
  return {
    id: address.id,
    title: address.title,
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    city: address.city,
    district: address.district,
    neighborhood: address.neighborhood ?? "",
    addressLine: address.addressLine,
    postalCode: address.postalCode ?? "",
    invoiceType: address.invoiceType,
    nationalId: address.nationalId ?? "",
    companyName: address.companyName ?? "",
    taxNumber: address.taxNumber ?? "",
    taxOffice: address.taxOffice ?? "",
    isDefaultShipping: address.isDefaultShipping,
    isDefaultBilling: address.isDefaultBilling,
  };
}

export function AddressManager({ addresses }: { addresses: AddressView[] }) {
  const [form, setForm] = useState<FormState>(blank);
  const [open, setOpen] = useState(addresses.length === 0);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function save() {
    startTransition(async () => {
      const { id, ...payload } = form;
      const result = await saveAddressAction(id, payload);
      if (result.ok) {
        setMessage({ text: "Adres kaydedildi", error: false });
        setForm(blank);
        setOpen(false);
      } else {
        setMessage({ text: result.error ?? "Kaydedilemedi", error: true });
      }
    });
  }

  function remove(id: string) {
    if (!window.confirm("Adres silinsin mi?")) return;
    startTransition(async () => {
      const result = await deleteAddressAction(id);
      setMessage(
        result.ok
          ? { text: "Adres silindi", error: false }
          : { text: result.error ?? "Silinemedi", error: true },
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {addresses.length === 0 && !open ? (
        <p className="text-sm text-slate-600">Kayıtlı adresiniz yok.</p>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {addresses.map((address) => (
          <li
            key={address.id}
            className="flex flex-col gap-2 rounded-2xl border border-slate-900/10 bg-white p-5 text-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <strong className="font-display text-base font-semibold text-brand-dark">
                {address.title}
              </strong>
              {(address.isDefaultShipping || address.isDefaultBilling) && (
                <span className="text-[11px] font-semibold tracking-wide text-primary uppercase">
                  {[
                    address.isDefaultShipping && "Teslimat",
                    address.isDefaultBilling && "Fatura",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </div>
            <p className="text-brand-dark">
              {address.firstName} {address.lastName} · {address.phone}
            </p>
            <p className="text-slate-500">
              {address.addressLine}
              {address.neighborhood ? `, ${address.neighborhood}` : ""}{" "}
              {address.district}/{address.city}
            </p>
            <div className="flex gap-4 pt-2">
              <button
                type="button"
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setForm(toForm(address));
                  setOpen(true);
                }}
              >
                Düzenle
              </button>
              <button
                type="button"
                className="text-sm font-semibold text-brand-pepper underline-offset-4 hover:underline"
                disabled={pending}
                onClick={() => remove(address.id)}
              >
                Sil
              </button>
            </div>
          </li>
        ))}
      </ul>

      {message ? (
        <p
          role={message.error ? "alert" : "status"}
          className={
            message.error
              ? "text-sm font-medium text-brand-pepper"
              : "text-sm font-medium text-brand-leaf"
          }
        >
          {message.text}
        </p>
      ) : null}

      {open ? (
        <section className="flex flex-col gap-5 rounded-2xl border border-slate-900/10 bg-white p-5 sm:p-6">
          <h3 className="font-display text-lg font-semibold text-brand-dark">
            {form.id ? "Adresi düzenle" : "Yeni adres"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={`${accountLabel} sm:col-span-2`}>
              Adres başlığı (Ev, İş…)
              <input
                className={accountField}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
            </label>
            <label className={accountLabel}>
              Ad
              <input
                className={accountField}
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
              />
            </label>
            <label className={accountLabel}>
              Soyad
              <input
                className={accountField}
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
              />
            </label>
            <label className={accountLabel}>
              Cep telefonu
              <input
                className={accountField}
                type="tel"
                inputMode="numeric"
                maxLength={TR_MOBILE_INPUT_MAX_DIGITS}
                placeholder="05XXXXXXXXX"
                value={form.phone}
                onChange={(e) =>
                  set("phone", sanitizeTurkishMobileInput(e.target.value))
                }
              />
            </label>
            <label className={accountLabel}>
              İl
              <select
                className={accountField}
                value={form.city}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    city: e.target.value,
                    district: "",
                  }))
                }
              >
                <option value="">Seçin</option>
                {TURKEY_PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </label>
            <label className={accountLabel}>
              İlçe
              <select
                className={accountField}
                value={form.district}
                disabled={!form.city}
                onChange={(e) => set("district", e.target.value)}
              >
                <option value="">
                  {form.city ? "Seçin" : "Önce il seçin"}
                </option>
                {districtsOf(form.city).map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </label>
            <label className={accountLabel}>
              Mahalle
              <input
                className={accountField}
                value={form.neighborhood}
                onChange={(e) => set("neighborhood", e.target.value)}
              />
            </label>
            <label className={`${accountLabel} sm:col-span-2`}>
              Açık adres
              <textarea
                className={accountTextarea}
                rows={3}
                value={form.addressLine}
                onChange={(e) => set("addressLine", e.target.value)}
              />
            </label>
            <label className={accountLabel}>
              Posta kodu
              <input
                className={accountField}
                value={form.postalCode}
                onChange={(e) => set("postalCode", e.target.value)}
              />
            </label>
            <label className={accountLabel}>
              Fatura tipi
              <select
                className={accountField}
                value={form.invoiceType}
                onChange={(e) =>
                  set("invoiceType", e.target.value as FormState["invoiceType"])
                }
              >
                <option value="INDIVIDUAL">Bireysel</option>
                <option value="CORPORATE">Kurumsal</option>
              </select>
            </label>
            {form.invoiceType === "INDIVIDUAL" ? (
              <label className={accountLabel}>
                T.C. kimlik no (isteğe bağlı)
                <input
                  className={accountField}
                  value={form.nationalId}
                  maxLength={11}
                  onChange={(e) => set("nationalId", e.target.value)}
                />
              </label>
            ) : (
              <>
                <label className={accountLabel}>
                  Firma unvanı
                  <input
                    className={accountField}
                    value={form.companyName}
                    onChange={(e) => set("companyName", e.target.value)}
                  />
                </label>
                <label className={accountLabel}>
                  Vergi numarası
                  <input
                    className={accountField}
                    value={form.taxNumber}
                    maxLength={10}
                    onChange={(e) => set("taxNumber", e.target.value)}
                  />
                </label>
                <label className={accountLabel}>
                  Vergi dairesi
                  <input
                    className={accountField}
                    value={form.taxOffice}
                    onChange={(e) => set("taxOffice", e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-brand-dark">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefaultShipping}
                onChange={(e) => set("isDefaultShipping", e.target.checked)}
              />
              Varsayılan teslimat adresi
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isDefaultBilling}
                onChange={(e) => set("isDefaultBilling", e.target.checked)}
              />
              Varsayılan fatura adresi
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className={accountPrimaryBtn}
            >
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </button>
            <button
              type="button"
              className={accountSecondaryBtn}
              onClick={() => {
                setForm(blank);
                setOpen(false);
              }}
            >
              Vazgeç
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          className={accountSecondaryBtn}
          onClick={() => {
            setForm(blank);
            setOpen(true);
          }}
        >
          Yeni adres ekle
        </button>
      )}
    </div>
  );
}
