"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

interface Slide {
  id: string;
  badge: string;
  titleLight: string;
  titleBold: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  imageUrl: string;
  imageAlt: string;
  /** Fotoğrafın sol alana yerleşimi (Tailwind sınıfı) */
  imagePosition: string;
}

const SLIDES: Slide[] = [
  {
    id: "dogal-tursular",
    badge: "1986'DAN BERİ · GELENEKSEL FERMANTASYON",
    titleLight: "Doğal Sabır,",
    titleBold: "Gerçek Çıtırlık.",
    description:
      "Mevsiminde toplanan sebzeler, Çankırı kaya tuzu ve sarımsakla meşe fıçılarda ağır ağır dinlendirilir. Asırlık ev lezzeti sofranızda.",
    primaryCta: { label: "Hemen Alışverişe Başla", href: "/ara" },
    secondaryCta: {
      label: "Klasik Turşular",
      href: "/kategori/klasik-tursular",
    },
    imageUrl: "/images/hero/hero-tursu-kavanozlar.jpg",
    imageAlt: "Kaplan Doğal Fermente Gurme Turşular ve Çıtır Kornişon",
    imagePosition: "object-right",
  },
  {
    id: "hediye-sandiklari",
    badge: "ÖZEL AHŞAP KUTU · HEDİYELİK KOLEKSİYON",
    titleLight: "Sofralara Asırlık",
    titleBold: "Gurme Dokunuş.",
    description:
      "Kaplan Turşu'nun en sevilen 6 çeşit ev turşusu ve katkısız şalgamı bir arada. Kırılmaz ahşap kutu ve korumalı ambalaj güvencesiyle.",
    primaryCta: {
      label: "Hediye Paketlerini Keşfet",
      href: "/kategori/hediye-kutulari",
    },
    secondaryCta: { label: "Kendi Turşunu Yap", href: "/kendi-tursunu-yap" },
    imageUrl: "/images/hero/hero-gift-boxes.jpg",
    imageAlt: "Özel Ahşap Sandıklı Gurme Turşu Hediye Seti",
    imagePosition: "object-right",
  },
  {
    id: "acili-salgam",
    badge: "MOR HAVUÇ VE EKŞİ MAYA İLE 45 GÜN FERMANTE",
    titleLight: "Katkısız, Hakiki",
    titleBold: "Adana Şalgamı.",
    description:
      "Tarsus ve Çukurova mor havuçlarından, hiçbir yapay asit veya renklendirici olmadan üretilen probiyotik zengini şalgam suyu.",
    primaryCta: {
      label: "Şalgam Çeşitlerini İncele",
      href: "/kategori/salgam-ve-tursu-suyu",
    },
    secondaryCta: { label: "Tüm Ürünler", href: "/ara" },
    imageUrl: "/images/hero/hero-salgam.jpg",
    imageAlt: "Geleneksel Meşe Fıçılarda Fermente Hakiki Şalgam Suyu",
    imagePosition: "object-center",
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Otomatik geçiş (5.5 saniye)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Klavye ok tuşları ile kontrol
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Dokunmatik kaydırma
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeSlide = SLIDES[current]!;

  return (
    <section
      aria-label="Öne Çıkan Kampanyalar ve Lezzetler"
      className="full-bleed -mt-6 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative flex flex-col bg-primary lg:min-h-[460px] lg:flex-row">
        {/* Fotoğraf: geniş ekranda solda, yeşil panelin altına girer */}
        <div className="relative h-56 w-full overflow-hidden sm:h-72 lg:absolute lg:inset-y-0 lg:left-0 lg:h-auto lg:w-[60%]">
          {SLIDES.map((slide, index) => (
            <Image
              key={slide.id}
              src={slide.imageUrl}
              alt={index === current ? slide.imageAlt : ""}
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 60vw, 100vw"
              className={`object-cover transition-opacity duration-700 ${slide.imagePosition} ${
                index === current ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        {/* Yeşil panel: eğik kenar + ince altın çizgi */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden w-[52%] bg-brand-gold [clip-path:polygon(9%_0,100%_0,100%_100%,0_100%)] lg:block"
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden w-[51.4%] bg-primary [clip-path:polygon(9%_0,100%_0,100%_100%,0_100%)] lg:block"
        />

        {/* Metin */}
        <div className="relative z-10 flex w-full flex-col justify-center px-6 py-8 pb-12 text-white sm:px-10 lg:ml-auto lg:w-[47%] lg:py-12 lg:pr-20 lg:pl-8">
          {/* SEO: tek sabit H1; slayt metni görsel başlık olarak kalır. */}
          <h1 className="sr-only">
            Kaplan Turşu — Geleneksel ev yapımı çubuk turşuları ve şalgam suyu
          </h1>
          <span className="text-[11px] font-bold tracking-[0.14em] text-amber-300 uppercase">
            {activeSlide.badge}
          </span>
          <p
            className="mt-3 font-display text-3xl leading-[1.08] font-bold tracking-tight sm:text-4xl xl:text-5xl"
            aria-live="polite"
          >
            {activeSlide.titleLight}{" "}
            <span className="block text-amber-300">
              {activeSlide.titleBold}
            </span>
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
            {activeSlide.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={activeSlide.primaryCta.href}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-amber-400 px-7 text-sm font-bold text-brand-dark shadow-lg shadow-black/15 transition hover:bg-amber-300"
            >
              {activeSlide.primaryCta.label}
              <ArrowRightIcon width={16} height={16} />
            </Link>
            <Link
              href={activeSlide.secondaryCta.href}
              className="inline-flex h-12 items-center rounded-full border border-white/35 px-6 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {activeSlide.secondaryCta.label}
            </Link>
          </div>
        </div>

        {/* Oklar */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Önceki Slayt"
          className="absolute top-28 left-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-md transition hover:scale-105 sm:top-36 lg:top-1/2 lg:left-5"
        >
          <ChevronLeftIcon width={20} height={20} />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Sonraki Slayt"
          className="absolute top-28 right-3 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary shadow-md transition hover:scale-105 sm:top-36 lg:top-1/2 lg:right-5"
        >
          <ChevronRightIcon width={20} height={20} />
        </button>

        {/* Göstergeler */}
        <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center gap-0.5">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={`Slayt ${index + 1}: ${slide.titleLight}`}
              aria-current={index === current}
              className="inline-flex min-h-11 min-w-11 items-center justify-center"
            >
              <span
                className={`block h-1.5 w-8 rounded-full transition-colors ${
                  index === current
                    ? "bg-amber-300"
                    : "bg-white/40 hover:bg-white/70"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
