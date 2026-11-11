"use client";

import { useActionState, useState } from "react";
import type { SavedAddress } from "@/modules/account/address.repository";
import type { PaymentOption } from "@/modules/checkout/checkout.service";
import { placeOrderAction, type CheckoutFormState } from "./actions";
import { AddressSection } from "./address-fields";
import { Field, inputClass } from "./checkout-form-field";
import { LegalAgreementsSection } from "./legal-agreements-section";
import { PaymentMethodSelector } from "./payment-method-selector";

const initial: CheckoutFormState = {};

export function CheckoutForm({
  defaultEmail,
  defaultCoupon,
  paymentOptions,
  savedAddresses,
  legalLinks,
}: {
  defaultEmail: string;
  defaultCoupon: string;
  paymentOptions: PaymentOption[];
  savedAddresses: SavedAddress[];
  legalLinks: { slug: string; title: string; href: string }[];
}) {
  const defaultShipping = savedAddresses.find((a) => a.isDefaultShipping);
  const defaultBilling = savedAddresses.find((a) => a.isDefaultBilling);
  const [state, formAction, pending] = useActionState(
    placeOrderAction,
    initial,
  );
  const [sameBilling, setSameBilling] = useState(true);
  const errors = state.fieldErrors;
  const canPay = paymentOptions.some((option) => option.available);

  const submitLabel = pending
    ? "Sipariş oluşturuluyor..."
    : canPay
      ? "Ödemeye geç"
      : "Ödeme şu anda kullanılamıyor";

  const submitClassName =
    "w-full rounded-theme bg-primary px-6 py-3 text-primary-foreground disabled:opacity-60";

  return (
    <>
      <form
        id="checkout-form"
        action={formAction}
        className="flex flex-col gap-8"
      >
        {state.message ? (
          <p
            role="alert"
            className="rounded-theme border border-red-300 bg-red-50 p-3 text-sm text-red-700"
          >
            {state.message}
          </p>
        ) : null}

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">İletişim</h2>
          <Field label="E-posta" name="email" errors={errors}>
            <input
              name="email"
              type="email"
              required
              defaultValue={defaultEmail}
              autoComplete="email"
              className={inputClass}
            />
          </Field>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Teslimat adresi</h2>
          <AddressSection
            prefix="shipping"
            addresses={savedAddresses}
            errors={errors}
            initialId={defaultShipping?.id}
          />
        </section>

        <section className="flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="sameBilling"
              checked={sameBilling}
              onChange={(event) => setSameBilling(event.target.checked)}
            />
            Fatura adresim teslimat adresimle aynı
          </label>
          {!sameBilling ? (
            <>
              <h2 className="text-lg font-semibold">Fatura adresi</h2>
              <AddressSection
                prefix="billing"
                addresses={savedAddresses}
                errors={errors}
                initialId={defaultBilling?.id}
              />
            </>
          ) : null}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Sipariş</h2>
          <Field label="Kupon kodu" name="couponCode" errors={errors}>
            <input
              name="couponCode"
              defaultValue={defaultCoupon}
              className={`${inputClass} uppercase`}
            />
          </Field>
          <Field
            label="Sipariş notu (isteğe bağlı)"
            name="customerNote"
            errors={errors}
          >
            <textarea
              name="customerNote"
              rows={2}
              maxLength={500}
              className={inputClass}
            />
          </Field>
        </section>

        <PaymentMethodSelector paymentOptions={paymentOptions} />

        <LegalAgreementsSection
          legalLinks={legalLinks}
          error={errors?.["acceptTerms"]}
        />

        <button
          type="submit"
          disabled={pending || !canPay}
          className={`hidden lg:inline-flex ${submitClassName}`}
        >
          {submitLabel}
        </button>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur-md lg:hidden">
        <button
          type="submit"
          form="checkout-form"
          disabled={pending || !canPay}
          className={submitClassName}
        >
          {submitLabel}
        </button>
      </div>
    </>
  );
}
