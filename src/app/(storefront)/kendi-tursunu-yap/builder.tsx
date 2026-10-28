"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { EASE_OUT } from "@/components/motion/motion";
import { BagIcon } from "@/components/storefront/icons";
import {
  BRINE_OPTIONS,
  INGREDIENT_GROUP_LABELS,
  MAX_INGREDIENTS,
  MAX_NOTE_LENGTH,
  SPICE_OPTIONS,
  type BrineOption,
  type IngredientGroup,
  type IngredientView,
  type SpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";
import type { BuilderSize } from "@/modules/custom-pickle/custom-pickle.service";
import { trackEvent } from "@/shared/analytics/client";
import { formatMoney } from "@/shared/money";
import { addCustomPickleAction } from "./actions";
import { Bidon } from "./bidon";

const BRINE_TEXT: Record<BrineOption, string> = {
  VINEGAR: "Üzüm sirkesiyle klasik, kıtır ve ekşi.",
  NATURAL: "Sirkesiz, tuzlu suda kendi kendine mayalanır.",
};

const SPICE_PEPPERS: Record<SpiceOption, number> = {
  MILD: 0,
  MEDIUM: 1,
  HOT: 3,
};

/** Sunucudaki hesapla aynı: kg başı ücret × bidon kilosu, kuruşa yuvarlanır. */
function extraFor(ingredient: IngredientView, size: BuilderSize | undefined) {
  const kg = size?.weightGram ? size.weightGram / 1000 : 1;
  return Math.round(Number(ingredient.pricePerKg) * kg * 100) / 100;
}

function Step({
  index,
  title,
  hint,
  children,
}: {
  index: number;
  title: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
    >
      <div className="flex items-end justify-between gap-4">
        <h2 className="flex items-center gap-3 font-display text-2xl font-semibold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {index}
          </span>
          {title}
        </h2>
        {hint ? (
          <span className="text-sm text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      {children}
    </motion.section>
  );
}

function PepperIcons({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          className={index < count ? "text-brand-pepper" : "text-border"}
        >
          <path
            fill="currentColor"
            d="M9 4c-1.5 4-1 9 3 16 2.5-5 3.5-10 2-16z"
          />
          <path
            d="M11 4c0-1.5 1-2.5 3-3"
            stroke="#2f5233"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      ))}
    </span>
  );
}

export function Builder({
  sizes,
  ingredients,
}: {
  sizes: BuilderSize[];
  ingredients: IngredientView[];
}) {
  const [variantId, setVariantId] = useState(
    () => (sizes.find((size) => size.inStock) ?? sizes[0])!.variantId,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [brine, setBrine] = useState<BrineOption>("VINEGAR");
  const [spice, setSpice] = useState<SpiceOption>("MEDIUM");
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const size = sizes.find((item) => item.variantId === variantId);
  const sizeIndex = sizes.findIndex((item) => item.variantId === variantId);
  const currency = size?.currency ?? "TRY";
  const byId = useMemo(
    () => new Map(ingredients.map((item) => [item.id, item])),
    [ingredients],
  );
  const chosen = selected
    .map((id) => byId.get(id))
    .filter((item): item is IngredientView => item !== undefined);

  const groups = useMemo(() => {
    const map = new Map<IngredientGroup, IngredientView[]>();
    for (const item of ingredients) {
      map.set(item.group, [...(map.get(item.group) ?? []), item]);
    }
    return [...map.entries()];
  }, [ingredients]);

  const base = Number(size?.price ?? 0);
  const extras = chosen.reduce((sum, item) => sum + extraFor(item, size), 0);
  const unit = Math.round((base + extras) * 100) / 100;
  const hasVegetable = chosen.some((item) => item.group === "VEGETABLE");
  const full = selected.length >= MAX_INGREDIENTS;
  const canAdd = Boolean(size?.inStock) && hasVegetable && !pending;

  function toggle(id: string) {
    setMessage(null);
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length >= MAX_INGREDIENTS
          ? current
          : [...current, id],
    );
  }

  function addToCart() {
    if (!size) return;
    startTransition(async () => {
      const result = await addCustomPickleAction({
        variantId,
        ingredientIds: selected,
        brine,
        spice,
        note,
        quantity,
      });
      if (!result.ok) {
        setMessage({ text: result.error ?? "Sepete eklenemedi", error: true });
        return;
      }
      setMessage({ text: "Bidonunuz sepete eklendi", error: false });
      setJustAdded(true);
      trackEvent("add_to_cart", {
        currency,
        value: unit * quantity,
        item: {
          id: variantId,
          name: "Kendi Turşunu Yap",
          price: unit,
          quantity,
          variant: size.label,
          brand: null,
        },
      });
    });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
      {/* Sahne: bidon ve seçilenler */}
      <div className="lg:sticky lg:top-40 lg:self-start">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-muted px-6 pt-8 pb-6">
          <div
            aria-hidden="true"
            className="absolute inset-x-10 top-16 aspect-square rounded-full bg-white/60"
          />
          <div className="relative mx-auto max-w-sm">
            <Bidon
              items={chosen}
              brine={brine}
              spice={spice}
              sizeLabel={size?.label ?? ""}
              scale={
                sizes.length > 1
                  ? 0.84 + (0.16 * Math.max(0, sizeIndex)) / (sizes.length - 1)
                  : 1
              }
            />
          </div>
          <div className="relative mt-4 flex min-h-9 flex-wrap justify-center gap-2">
            <AnimatePresence mode="popLayout">
              {chosen.length === 0 ? (
                <motion.p
                  key="empty"
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Malzeme seçtikçe bidonunuz dolacak.
                </motion.p>
              ) : (
                chosen.map((item) => (
                  <motion.button
                    layout
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item.id)}
                    aria-label={`${item.name} malzemesini çıkar`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-white py-1 pr-2.5 pl-1 text-xs font-medium text-primary shadow-sm"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <Image
                      src={item.imageUrl ?? "/placeholder.svg"}
                      alt=""
                      width={22}
                      height={22}
                    />
                    {item.name}
                    <span aria-hidden="true" className="text-muted-foreground">
                      ×
                    </span>
                  </motion.button>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Adımlar */}
      <div className="flex flex-col gap-12">
        <Step index={1} title="Bidon boyutu">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {sizes.map((item) => {
              const active = item.variantId === variantId;
              return (
                <button
                  key={item.variantId}
                  type="button"
                  aria-pressed={active}
                  disabled={!item.inStock}
                  onClick={() => {
                    setVariantId(item.variantId);
                    setMessage(null);
                  }}
                  className="relative flex flex-col items-start gap-1 rounded-2xl border-2 border-border bg-white p-4 text-left transition-colors hover:border-primary/40 disabled:opacity-40"
                >
                  {active ? (
                    <motion.span
                      layoutId="size-highlight"
                      aria-hidden="true"
                      className="absolute -inset-0.5 rounded-2xl border-2 border-primary bg-primary/5"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  ) : null}
                  <span className="relative font-display text-xl font-semibold">
                    {item.label}
                  </span>
                  <span className="relative text-sm text-muted-foreground">
                    {item.inStock
                      ? formatMoney(item.price, item.currency)
                      : "Tükendi"}
                  </span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step
          index={2}
          title="Malzemeler"
          hint={
            <span className={full ? "font-semibold text-brand-pepper" : ""}>
              {selected.length}/{MAX_INGREDIENTS} seçildi
            </span>
          }
        >
          <p className="-mt-2 text-sm text-muted-foreground">
            En az bir sebze seçin. Fiyatlar seçtiğiniz bidon boyutuna göre
            hesaplanır.
          </p>
          {groups.map(([group, items]) => (
            <div key={group} className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-brand-leaf uppercase">
                {INGREDIENT_GROUP_LABELS[group]}
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => {
                  const active = selected.includes(item.id);
                  const disabled = !active && full;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      disabled={disabled}
                      onClick={() => toggle(item.id)}
                      whileTap={{ scale: 0.95 }}
                      className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 bg-white p-3 text-center transition-colors disabled:opacity-40 ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <AnimatePresence>
                        {active ? (
                          <motion.span
                            aria-hidden="true"
                            className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 20,
                            }}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12.5 10 17 19 7" />
                            </svg>
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                      <motion.span
                        className="relative h-14 w-14"
                        animate={
                          active ? { rotate: [0, -12, 10, 0] } : { rotate: 0 }
                        }
                        transition={{ duration: 0.5 }}
                      >
                        <Image
                          src={item.imageUrl ?? "/placeholder.svg"}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-contain transition-transform group-hover:scale-110"
                        />
                      </motion.span>
                      <span className="text-sm leading-tight font-semibold">
                        {item.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        +{formatMoney(extraFor(item, size), currency)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </Step>

        <Step index={3} title="Salamura">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(BRINE_OPTIONS) as BrineOption[]).map((key) => {
              const active = brine === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setBrine(key)}
                  className="relative flex flex-col items-start gap-1 rounded-2xl border-2 border-border bg-white p-4 text-left transition-colors hover:border-primary/40"
                >
                  {active ? (
                    <motion.span
                      layoutId="brine-highlight"
                      aria-hidden="true"
                      className="absolute -inset-0.5 rounded-2xl border-2 border-primary bg-primary/5"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  ) : null}
                  <span className="relative font-semibold">
                    {BRINE_OPTIONS[key]}
                  </span>
                  <span className="relative text-sm text-muted-foreground">
                    {BRINE_TEXT[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step index={4} title="Acılık">
          <div className="grid grid-cols-3 gap-2 rounded-full border border-border bg-white p-1.5">
            {(Object.keys(SPICE_OPTIONS) as SpiceOption[]).map((key) => {
              const active = spice === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSpice(key)}
                  className={`relative flex flex-col items-center gap-1 rounded-full px-2 py-2.5 text-sm font-semibold transition-colors sm:flex-row sm:justify-center sm:gap-2 ${active ? "text-primary-foreground" : "text-foreground/80"}`}
                >
                  {active ? (
                    <motion.span
                      layoutId="spice-highlight"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                    />
                  ) : null}
                  <span className="relative">{SPICE_OPTIONS[key]}</span>
                  <span className="relative">
                    <PepperIcons count={SPICE_PEPPERS[key]} />
                  </span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step index={5} title="Notunuz" hint="İsteğe bağlı">
          <label htmlFor="pickle-note" className="sr-only">
            Not
          </label>
          <textarea
            id="pickle-note"
            value={note}
            maxLength={MAX_NOTE_LENGTH}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Örneğin: sarımsak bol olsun, havuçlar ince doğransın…"
            className="w-full rounded-2xl border border-border bg-white p-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
          <span className="-mt-2 self-end text-xs text-muted-foreground">
            {note.length}/{MAX_NOTE_LENGTH}
          </span>
        </Step>

        {/* Özet */}
        <section
          aria-label="Bidon özeti"
          className="flex flex-col gap-4 rounded-[2rem] bg-brand-dark p-6 text-brand-cream sm:p-8"
        >
          <h2 className="font-display text-2xl font-semibold">Bidonunuz</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt>{size?.label ?? "Bidon"}</dt>
              <dd>{formatMoney(base, currency)}</dd>
            </div>
            <AnimatePresence initial={false}>
              {chosen.map((item) => (
                <motion.div
                  key={item.id}
                  className="flex justify-between gap-4 text-brand-cream/75"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <dt>{item.name}</dt>
                  <dd>+{formatMoney(extraFor(item, size), currency)}</dd>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="flex justify-between gap-4 text-brand-cream/75">
              <dt>Salamura · acılık</dt>
              <dd>
                {BRINE_OPTIONS[brine]} · {SPICE_OPTIONS[spice]}
              </dd>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-white/15 pt-3">
              <dt className="font-semibold">Bidon fiyatı</dt>
              <dd>
                <motion.span
                  key={unit}
                  className="inline-block font-display text-3xl font-semibold text-accent"
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                  {formatMoney(unit, currency)}
                </motion.span>
              </dd>
            </div>
          </dl>

          <div className="flex items-stretch gap-2 sm:gap-3">
            <div className="flex items-center rounded-full border border-white/20">
              <button
                type="button"
                aria-label="Adedi azalt"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                disabled={quantity <= 1}
                className="inline-flex h-12 w-10 items-center justify-center text-lg disabled:opacity-30"
              >
                −
              </button>
              <span
                className="w-8 text-center text-sm font-semibold"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Adedi artır"
                onClick={() => setQuantity((value) => Math.min(20, value + 1))}
                disabled={quantity >= 20}
                className="inline-flex h-12 w-10 items-center justify-center text-lg disabled:opacity-30"
              >
                +
              </button>
            </div>
            <motion.button
              type="button"
              onClick={addToCart}
              disabled={!canAdd}
              whileTap={{ scale: 0.97 }}
              className="relative inline-flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-accent px-4 text-sm font-semibold whitespace-nowrap text-brand-dark transition hover:bg-[#e9bb3c] disabled:opacity-50"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={justAdded ? "added" : "idle"}
                  className="inline-flex items-center gap-2"
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -16, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                >
                  {justAdded ? (
                    "Sepete eklendi ✓"
                  ) : (
                    <>
                      <BagIcon width={18} height={18} />
                      {pending
                        ? "Ekleniyor..."
                        : `Sepete ekle · ${formatMoney(unit * quantity, currency)}`}
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>

          {!hasVegetable ? (
            <p className="text-sm text-brand-cream/70">
              Sepete eklemek için en az bir sebze seçin.
            </p>
          ) : null}

          {message ? (
            <p
              role={message.error ? "alert" : "status"}
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${message.error ? "bg-red-50 text-red-700" : "bg-white/10 text-brand-cream"}`}
            >
              {message.text}
              {message.error ? null : (
                <>
                  {" · "}
                  <Link href="/sepet" className="underline">
                    Sepete git
                  </Link>
                </>
              )}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
