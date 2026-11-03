/**
 * Vitrinde gösterilen iletişim bilgileri (frontend sabitleri).
 * E-posta siteConfig + admin ayarlarından gelir; telefon, adres,
 * saatler ve sosyal bağlantılar burada tutulur.
 */
export const storefrontContact = {
  address: "Barbaros, Karagöl Cd. no:129, 06760 Çubuk/Ankara",
  mapsUrl:
    "https://www.google.com/maps/place/%C3%87ubuk+Kaplan+Tur%C5%9Fular%C4%B1/@40.2509353,33.0210037,665m/data=!3m2!1e3!4b1!4m6!3m5!1s0x4082152eca3f6467:0x9fdb82f10f86123a!8m2!3d40.2509353!4d33.0235786!16s%2Fg%2F11qnvkrr9l?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D",
  phone: "0507 542 03 01",
  /** E.164 tel: linki */
  phoneTel: "+905075420301",
  workingHours: "Her gün 09:00–19:00",
  /** schema.org OpeningHoursSpecification için */
  openingHours: {
    daysOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "09:00",
    closes: "19:00",
  },
  instagramUrl: "https://www.instagram.com/cubukkaplantursulari/",
  trendyolUrl:
    "https://www.trendyol.com/magaza/kaplantursu-m-224212?sst=0",
} as const;
