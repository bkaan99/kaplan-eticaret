import type { PaymentOption } from "@/modules/checkout/checkout.service";

export const METHOD_LABELS: Record<PaymentOption["method"], string> = {
  CARD: "Kredi/banka kartı",
  BANK_TRANSFER: "Havale / EFT",
  DEFERRED: "Vadeli ödeme (cari hesap)",
};

interface PaymentMethodSelectorProps {
  paymentOptions: PaymentOption[];
}

export function PaymentMethodSelector({
  paymentOptions,
}: PaymentMethodSelectorProps) {
  if (paymentOptions.length <= 1) {
    return <input type="hidden" name="paymentMethod" value="CARD" />;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Ödeme yöntemi</h2>
      {paymentOptions.map((option, index) => (
        <label
          key={option.method}
          className={`flex items-start gap-3 rounded-theme border border-border p-3 text-sm ${
            option.available ? "" : "opacity-60"
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value={option.method}
            defaultChecked={index === 0}
            disabled={!option.available}
            className="mt-1"
          />
          <span className="flex flex-col">
            <span className="font-medium">
              {METHOD_LABELS[option.method]}
            </span>
            {option.note ? (
              <span className="text-muted-foreground">{option.note}</span>
            ) : null}
          </span>
        </label>
      ))}
    </section>
  );
}
