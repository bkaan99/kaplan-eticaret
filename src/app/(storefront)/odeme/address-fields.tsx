"use client";

import { useState } from "react";
import type { SavedAddress } from "@/modules/account/address.repository";
import { districtsOf } from "@/shared/geo/turkey-districts";
import { TURKEY_PROVINCES } from "@/shared/geo/turkey-provinces";
import { Field, inputClass } from "./checkout-form-field";

export function AddressFields({
  prefix,
  errors,
  saved,
}: {
  prefix: "shipping" | "billing";
  errors?: Record<string, string>;
  saved?: SavedAddress;
}) {
  const [invoiceType, setInvoiceType] = useState(
    saved?.invoiceType ?? "INDIVIDUAL",
  );
  const [city, setCity] = useState(saved?.city ?? "");
  const districts = districtsOf(city);
  const name = (field: string) => `${prefix}.${field}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Ad" name={name("firstName")} errors={errors}>
        <input
          name={name("firstName")}
          defaultValue={saved?.firstName}
          required
          autoComplete="given-name"
          className={inputClass}
        />
      </Field>
      <Field label="Soyad" name={name("lastName")} errors={errors}>
        <input
          name={name("lastName")}
          defaultValue={saved?.lastName}
          required
          autoComplete="family-name"
          className={inputClass}
        />
      </Field>
      <Field label="Cep telefonu" name={name("phone")} errors={errors}>
        <input
          name={name("phone")}
          type="tel"
          defaultValue={saved?.phone}
          required
          autoComplete="tel"
          placeholder="05XX XXX XX XX"
          className={inputClass}
        />
      </Field>
      <Field label="İl" name={name("city")} errors={errors}>
        <select
          name={name("city")}
          required
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            İl seçin
          </option>
          {TURKEY_PROVINCES.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </Field>
      <Field label="İlçe" name={name("district")} errors={errors}>
        <select
          key={city}
          name={name("district")}
          required
          defaultValue={
            city === saved?.city && districts.includes(saved?.district ?? "")
              ? saved?.district
              : ""
          }
          disabled={districts.length === 0}
          className={inputClass}
        >
          <option value="" disabled>
            {city ? "İlçe seçin" : "Önce il seçin"}
          </option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Mahalle" name={name("neighborhood")} errors={errors}>
        <input
          name={name("neighborhood")}
          defaultValue={saved?.neighborhood ?? ""}
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Açık adres" name={name("addressLine")} errors={errors}>
          <textarea
            name={name("addressLine")}
            defaultValue={saved?.addressLine}
            required
            rows={3}
            autoComplete="street-address"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Posta kodu" name={name("postalCode")} errors={errors}>
        <input
          name={name("postalCode")}
          defaultValue={saved?.postalCode ?? ""}
          autoComplete="postal-code"
          className={inputClass}
        />
      </Field>

      <fieldset className="flex items-center gap-4 text-sm sm:col-span-2">
        <legend className="sr-only">Fatura tipi</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={name("invoiceType")}
            value="INDIVIDUAL"
            checked={invoiceType === "INDIVIDUAL"}
            onChange={() => setInvoiceType("INDIVIDUAL")}
          />
          Bireysel
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={name("invoiceType")}
            value="CORPORATE"
            checked={invoiceType === "CORPORATE"}
            onChange={() => setInvoiceType("CORPORATE")}
          />
          Kurumsal
        </label>
      </fieldset>

      {invoiceType === "INDIVIDUAL" ? (
        <Field
          label="T.C. kimlik no (isteğe bağlı)"
          name={name("nationalId")}
          errors={errors}
        >
          <input
            name={name("nationalId")}
            defaultValue={saved?.nationalId ?? ""}
            inputMode="numeric"
            maxLength={11}
            className={inputClass}
          />
        </Field>
      ) : (
        <>
          <Field
            label="Firma unvanı"
            name={name("companyName")}
            errors={errors}
          >
            <input
              name={name("companyName")}
              defaultValue={saved?.companyName ?? ""}
              className={inputClass}
            />
          </Field>
          <Field
            label="Vergi numarası"
            name={name("taxNumber")}
            errors={errors}
          >
            <input
              name={name("taxNumber")}
              defaultValue={saved?.taxNumber ?? ""}
              inputMode="numeric"
              maxLength={10}
              className={inputClass}
            />
          </Field>
          <Field label="Vergi dairesi" name={name("taxOffice")} errors={errors}>
            <input
              name={name("taxOffice")}
              defaultValue={saved?.taxOffice ?? ""}
              className={inputClass}
            />
          </Field>
        </>
      )}
    </div>
  );
}

/** Kayıtlı adres seçimi; seçim alanları yeniden oluşturarak değerleri doldurur. */
export function AddressSection({
  prefix,
  addresses,
  errors,
  initialId,
}: {
  prefix: "shipping" | "billing";
  addresses: SavedAddress[];
  errors?: Record<string, string>;
  initialId?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialId ?? "");
  const selected = addresses.find((address) => address.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      {addresses.length > 0 ? (
        <label className="flex flex-col gap-1 text-sm">
          <span>Kayıtlı adreslerim</span>
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className={inputClass}
          >
            <option value="">Yeni adres gir</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.title} — {address.district}/{address.city}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <AddressFields
        key={selectedId || "new"}
        prefix={prefix}
        errors={errors}
        saved={selected}
      />
    </div>
  );
}
