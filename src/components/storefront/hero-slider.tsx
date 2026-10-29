"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./icons";

interface Slide {
  id: string;
  badge: string;
  badgeIcon: string;
  titleLight: string;
  titleBold: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  imageUrl: string;
  imageAlt: string;
  theme: "light" | "dark";
  highlightPill: string;
}

const SLIDES: Slide[] = [
  {
    id: "dogal-tursular",
    badge: "1986'DAN BERİ · GELENEKSEL FERMANTASYON",
    badgeIcon: "🌿",
    titleLight: "Doğal Sabır,",
    titleBold: "Gerçek Çıtırlık.",
    description:
      "Mevsiminde toplanan sebzeler, Çankırı kaya tuzu ve sarımsakla meşe fıçılarda ağır ağır dinlendirilir. Asırlık ev lezzeti sofranızda.",
    primaryCta: { label: "Hemen Alışverişe Başla", href: "/ara" },
    secondaryCta: { label: "Klasik Turşular", href: "/kategori/klasik-tursular" },
    imageUrl: "/images/hero/hero-panoramic.jpg",
    imageAlt: "Kaplan Doğal Fermente Gurme Turşular ve Çıtır Kornişon",
    theme: "light",
    highlightPill: "🥒 %100 Katkısız Çıtır Kornişon & Salatalık",
  },
  {
    id: "hediye-sandiklari",
    badge: "ÖZEL AHŞAP KUTU · HEDİYELİK KOLEKSİYON",
    badgeIcon: "🎁",
    titleLight: "Sofralara Asırlık",
    titleBold: "Gurme Dokunuş.",
    description:
      "Kaplan Turşu'nun en sevilen 6 çeşit ev turşusu ve katkısız şalgamı bir arada. Kırılmaz ahşap kutu ve korumalı ambalaj güvencesiyle.",
    primaryCta: { label: "Hediye Paketlerini Keşfet", href: "/kategori/hediye-kutulari" },
    secondaryCta: { label: "Kendi Turşunu Yap", href: "/kendi-tursunu-yap" },
    imageUrl: "/images/hero/hero-gift-boxes.jpg",
    imageAlt: "Özel Ahşap Sandıklı Gurme Turşu Hediye Seti",
    theme: "light",
    highlightPill: "📦 Özel Hava Yastıklı Kırılmaz Koli Garantisi",
  },
  {
    id: "acili-salgam",
    badge: "MOR HAVUÇ VE EKŞİ MAYA İLE 45 GÜN FERMANTE",
    badgeIcon: "🍷",
    titleLight: "Katkısız, Hakiki",
    titleBold: "Adana Şalgamı.",
    description:
      "Tarsus ve Çukurova mor havuçlarından, hiçbir yapay asit veya renklendirici olmadan üretilen probiyotik zengini şalgam suyu.",
    primaryCta: { label: "Şalgam Çeşitlerini İncele", href: "/kategori/salgam-ve-tursu-suyu" },
    secondaryCta: { label: "Tüm Ürünler", href: "/ara" },
    imageUrl: "/images/hero/hero-salgam.jpg",
    imageAlt: "Geleneksel Meşe Fıçılarda Fermente Hakiki Şalgam Suyu",
    theme: "dark",
    highlightPill: "🌶️ Doğal Çukurova Biberi Acısı & Kaya Tuzu",
  },
];

const QUICK_TAGS = [
  { label: "Çıtır Kornişon", href: "/urun/kornison-tursusu", icon: "🥒" },
  { label: "Ev Usulü Salatalık", href: "/urun/ev-usulu-salatalik-tursusu", icon: "🌱" },
  { label: "Acılı Şalgam", href: "/urun/acili-salgam-suyu", icon: "🍷" },
  { label: "Gurme Hediye Kutusu", href: "/kategori/hediye-kutulari", icon: "🎁" },
  { label: "Kendi Turşunu Yap", href: "/kendi-tursunu-yap", icon: "✦" },
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
  const isDark = activeSlide.theme === "dark";

  return (
    <section
      aria-label="Öne Çıkan Kampanyalar ve Lezzetler"
      className="relative left-1/2 -ml-[50vw] -mr-[50vw] -mt-6 w-screen max-w-[100vw] overflow-hidden bg-slate-900 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slayt Görselleri ve Katmanları */}
      <div className="relative min-h-[540px] sm:min-h-[600px] lg:min-h-[660px] xl:min-h-[700px] w-full">
        {SLIDES.map((slide, index) => {
          const isActive = index === current;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              <Image
                src={slide.imageUrl}
                alt={slide.imageAlt}
                fill
                priority={index === 0}
                sizes="100vw"
                className={`object-cover ${
                  slide.id === "acili-salgam"
                    ? "object-center"
                    : "object-right-bottom md:object-right lg:object-center"
                }`}
              />

              {/* Okunabilirlik Degradeleri */}
              {slide.theme === "light" ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#fdfbf7] via-[#fdfbf7]/95 to-[#fdfbf7]/20 sm:w-[80%] md:w-[65%] lg:w-[58%] w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#fdfbf7]/90 via-transparent to-transparent sm:hidden" />
                </>
              ) : (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent sm:w-[80%] md:w-[65%] lg:w-[58%] w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent sm:hidden" />
                </>
              )}
            </div>
          );
        })}

        {/* Metin ve İçerik Alanı (max-w-6xl ızgarasına hizalı) */}
        <div className="relative z-20 mx-auto flex min-h-[540px] sm:min-h-[600px] lg:min-h-[660px] xl:min-h-[700px] max-w-6xl flex-col justify-center px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-xl lg:max-w-2xl">
            {/* Üst Rozet */}
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold shadow-2xs backdrop-blur-md transition-colors duration-500 ${
                isDark
                  ? "border border-amber-500/30 bg-amber-950/40 text-amber-300"
                  : "border border-emerald-900/15 bg-white/90 text-emerald-950"
              }`}
            >
              <span>{activeSlide.badgeIcon}</span>
              <span>{activeSlide.badge}</span>
            </div>

            {/* Ana Başlık */}
            <h1
              className={`mt-4 font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] transition-colors duration-500 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {activeSlide.titleLight}{" "}
              <span
                className={`italic font-normal block sm:inline ${
                  isDark ? "text-amber-400" : "text-primary"
                }`}
              >
                {activeSlide.titleBold}
              </span>
            </h1>

            {/* Açıklama Metni */}
            <p
              className={`mt-4 max-w-lg text-base sm:text-lg leading-relaxed transition-colors duration-500 ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}
            >
              {activeSlide.description}
            </p>

            {/* Butonlar */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={activeSlide.primaryCta.href}
                className={`inline-flex h-12 items-center gap-2.5 rounded-full px-8 text-sm font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
                  isDark
                    ? "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20"
                    : "bg-primary text-white hover:bg-[#0b2318] shadow-primary/20"
                }`}
              >
                <span>{activeSlide.primaryCta.label}</span>
                <ArrowRightIcon width={16} height={16} />
              </Link>
              <Link
                href={activeSlide.secondaryCta.href}
                className={`inline-flex h-12 items-center rounded-full border px-6 text-sm font-semibold shadow-2xs backdrop-blur-md transition ${
                  isDark
                    ? "border-slate-700 bg-slate-900/60 text-white hover:bg-slate-800"
                    : "border-slate-300 bg-white/90 text-slate-800 hover:bg-white hover:border-slate-400"
                }`}
              >
                {activeSlide.secondaryCta.label}
              </Link>
            </div>

            {/* Vurgu Rozeti */}
            <div className="mt-6 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-xs ${
                  isDark
                    ? "bg-white/10 text-slate-300"
                    : "bg-slate-200/60 text-slate-700"
                }`}
              >
                {activeSlide.highlightPill}
              </span>
            </div>
          </div>
        </div>

        {/* Sol & Sağ Navigasyon Okları */}
        <div className="absolute inset-y-0 left-0 right-0 z-30 pointer-events-none flex items-center justify-between px-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Önceki Slayt"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md shadow-lg transition-all duration-200 hover:scale-110 hover:bg-black/50 active:scale-95"
          >
            <ChevronLeftIcon width={22} height={22} />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Sonraki Slayt"
            className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md shadow-lg transition-all duration-200 hover:scale-110 hover:bg-black/50 active:scale-95"
          >
            <ChevronRightIcon width={22} height={22} />
          </button>
        </div>

        {/* Alt Göstergeler (Pagination Dots + Slide Counter) */}
        <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-30 pointer-events-none">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            {/* Nokta Göstergeleri */}
            <div className="pointer-events-auto flex items-center gap-2">
              {SLIDES.map((slide, index) => {
                const isActive = index === current;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`Slayt ${index + 1}: ${slide.titleLight}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isActive
                        ? isDark
                          ? "w-8 bg-amber-400"
                          : "w-8 bg-primary"
                        : isDark
                          ? "w-2.5 bg-white/40 hover:bg-white/70"
                          : "w-2.5 bg-slate-400/50 hover:bg-slate-600"
                    }`}
                  />
                );
              })}
            </div>

            {/* Slayt Sayacı */}
            <div
              className={`rounded-full px-3 py-1 text-xs font-mono font-semibold tracking-widest backdrop-blur-md ${
                isDark
                  ? "bg-black/40 text-slate-300 border border-white/10"
                  : "bg-white/80 text-slate-700 border border-slate-200/80"
              }`}
            >
              0{current + 1} / 0{SLIDES.length}
            </div>
          </div>
        </div>
      </div>

      {/* Alt Hızlı Kategori Rayı */}
      <div className="border-t border-slate-200/60 bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold tracking-wider text-slate-500 uppercase shrink-0">
            Hızlı Keşfet
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {QUICK_TAGS.map((tag) => (
              <Link
                key={tag.label}
                href={tag.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-3.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-primary hover:bg-white hover:text-primary"
              >
                <span>{tag.icon}</span>
                <span>{tag.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
