import { storefrontContact } from "@/config/storefront-contact";
import {
  getCachedContactSettings,
  getCachedShippingSettings,
} from "@/modules/settings/cached";
import { formatMoney } from "@/shared/money";

/**
 * Sipariş öncesi güven bilgileri ve destek bağlantıları. Ücretsiz kargo eşiği
 * ve iletişim kanalları panelden (Ayarlar) okunur; metinler elle güncellenmez.
 */
export async function BuilderTrustStrip() {
  const [shipping, contact] = await Promise.all([
    getCachedShippingSettings(),
    getCachedContactSettings(),
  ]);

  const items = [
    {
      title: "Çubuk Ovası'ndan taze",
      text: "Sebzeler yerel çiftçiden, sabahın erken saatinde gelir",
    },
    {
      title: "Çankırı kaya tuzu",
      text: "Rafine tuz yok; salamura doğal kaya tuzuyla hazırlanır",
    },
    {
      title: "Tarifine göre hazırlanır",
      text: "Seçtiğin gramajlar ve etiket adın bidona aynen geçer",
    },
    {
      title: "24-48 saatte kargoda",
      text: `${formatMoney(shipping.freeShippingThreshold)} ve üzeri siparişlerde kargo ücretsiz`,
    },
  ];

  const whatsappDigits = contact.whatsapp?.replace(/\D/g, "");

  return (
    <section
      aria-label="Kaplan sözü"
      className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(11,35,24,0.04),0_12px_28px_-16px_rgba(11,35,24,0.16)] sm:p-6"
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-brand-leaf"
            >
              <svg
                viewBox="0 0 20 20"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 10.5l4 4 8-9" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-bold text-primary">
                {item.title}
              </span>
              <span className="block text-xs leading-snug text-slate-600">
                {item.text}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-primary">
          Tarifin için ustaya danışabilirsin.
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <a
            href={`tel:${storefrontContact.phoneTel}`}
            className="inline-flex h-9 items-center rounded-full border border-slate-200 px-4 text-primary transition-colors hover:border-primary"
          >
            Ara · {contact.phone}
          </a>
          {whatsappDigits ? (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center rounded-full border border-slate-200 px-4 text-primary transition-colors hover:border-primary"
            >
              WhatsApp
            </a>
          ) : null}
          <a
            href={`mailto:${contact.email}`}
            className="inline-flex h-9 items-center rounded-full border border-slate-200 px-4 text-primary transition-colors hover:border-primary"
          >
            E-posta
          </a>
        </div>
      </div>
    </section>
  );
}
