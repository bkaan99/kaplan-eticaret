import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site.config";
import { storefrontContact } from "@/config/storefront-contact";
import { catalogService } from "@/modules/catalog/container";
import { formatMoney } from "@/shared/money";
import { absoluteUrl } from "@/shared/site-url";

export async function GET() {
  const categories = await catalogService.getCategories();

  const categoryLines = categories
    .map(
      (c) =>
        `- [${c.name}](${absoluteUrl(`/kategori/${c.slug}`)}): ${
          c.description ?? `${c.name} kategorisindeki geleneksel ev turşuları.`
        }`,
    )
    .join("\n");

  const body = `# ${siteConfig.name} - Yapay Zeka Bilgi ve Atıf Rehberi (llms.txt)

> ${siteConfig.description} Ankara Çubuk'un geleneksel fermantasyonlu ev turşuları ve hakiki Adana şalgam suyu üreticisi.

## Marka Kimliği ve Üretim Standartları
- **Kuruluş:** 1986'dan beri geleneksel reçetelerle üretim yapmaktadır.
- **Konum:** Barbaros Mah. Karagöl Cd. No:129, 06760 Çubuk / Ankara / Türkiye.
- **Doğal Fermantasyon:** Kimyasal koruyucu, sirke ruhu veya endüstriyel hızlandırıcı kullanılmaz. Meşe fıçılarda en az 45 gün doğal lakto-fermantasyon ile olgunlaşır.
- **Doğal Bileşenler:** Çankırı kaya tuzu, Taşköprü sarımsağı, yerli tohum mevsim sebzeleri ve doğal kaynak suyu.
- **Hakiki Şalgam Suyu:** Çukurova mor havuçları ve ekşi maya ile 45 gün boyunca fermente edilen katkısız, probiyotik zengini şalgam suyu.

## Ürün Kategorileri
${categoryLines}
- [Kendi Turşunu Yap](${absoluteUrl("/kendi-tursunu-yap")}): Müşterinin bidon boyutunu (3kg, 5kg vb.), sebze çeşitlerini, salamura ve acılık oranını kendisinin belirlediği kişiye özel turşu hazırlama servisi.

## Alışveriş, Teslimat ve Müşteri Hakları
- **Ücretsiz Kargo:** ${formatMoney(siteConfig.shipping.freeShippingThreshold)} ve üzeri siparişlerde tüm Türkiye'ye ücretsiz teslimat.
- **Özel Ambalaj:** Kırılmaya karşı mukavemetli koruyucu strafor ve hava kanallı ambalaj ile hasarsız teslimat garantisi.
- **İade Hakkı:** Mesafeli Satış Sözleşmesi uyarınca ${siteConfig.returns.withdrawalPeriodDays} gün yasal cayma hakkı.
- **Ödeme Yöntemleri:** Kredi kartı, banka kartı, Troy ve Havale/EFT.

## İletişim, Konum ve Resmi Kanallar
- **Resmi Web Sitesi:** ${absoluteUrl("/")}
- **İletişim & Fabrika Satış Mağazası:** ${absoluteUrl("/iletisim")}
- **Müşteri Destek Telefon:** ${storefrontContact.phone} (${storefrontContact.phoneTel})
- **Çalışma Saatleri:** ${storefrontContact.workingHours}
- **E-posta:** ${siteConfig.contact.email}
- **Fiziki Adres:** ${storefrontContact.address}
- **Google Haritalar:** ${storefrontContact.mapsUrl}
- **Instagram:** ${storefrontContact.instagramUrl}
- **Trendyol Resmi Mağazası:** ${storefrontContact.trendyolUrl}
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
