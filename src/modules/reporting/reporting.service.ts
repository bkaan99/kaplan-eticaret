import Decimal from "decimal.js";
import { toDecimal } from "@/shared/money";

export interface PeriodTotals {
  revenue: Decimal;
  orderCount: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: string;
}

export interface LowStockItem {
  productName: string;
  sku: string;
  available: number;
}

/** Ciro grafiği için ham sipariş satırı. */
export interface RevenueRow {
  createdAt: Date;
  grandTotal: Decimal.Value;
}

/** Grafikteki tek sütun (gün veya ay). */
export interface RevenueBucket {
  /** YYYY-MM-DD (günlük) veya YYYY-MM (aylık), Türkiye saatine göre */
  key: string;
  label: string;
  revenue: string;
  orderCount: number;
}

/** Turşu siparişinden malzeme satırı (sipariş satırındaki kopya). */
export interface IngredientUsageRow {
  quantity: number;
  customization: unknown;
}

export interface PopularIngredient {
  name: string;
  /** Bu malzemenin girdiği bidon sayısı */
  jarCount: number;
  /** Bidonların yüzde kaçında var (0–100) */
  sharePercent: number;
}

export interface CustomerMetrics {
  /** Dönemde kayıt olan müşteri sayısı */
  newCustomers: number;
  /** Dönemde sipariş veren benzersiz üye sayısı */
  buyers: number;
  /** Bunlardan daha önce de sipariş vermiş olanlar */
  returningBuyers: number;
}

export interface DashboardData {
  periodDays: number;
  customers: CustomerMetrics & {
    newChangePercent: number | null;
    /** Tekrar alışveriş yapan üye oranı (%), alıcı yoksa null */
    returningRate: number | null;
  };
  revenue: { current: string; previous: string; changePercent: number | null };
  orders: { current: number; previous: number; changePercent: number | null };
  averageOrderValue: string;
  revenueSeries: {
    granularity: "day" | "month";
    buckets: RevenueBucket[];
  };
  topProducts: TopProduct[];
  popularIngredients: { totalJars: number; items: PopularIngredient[] };
  attention: {
    ordersToProcess: number;
    openReturnRequests: number;
    pendingDealers: number;
    lowStock: LowStockItem[];
  };
}

export interface ReportingRepository {
  periodTotals(from: Date, to: Date): Promise<PeriodTotals>;
  topProducts(from: Date, to: Date, limit: number): Promise<TopProduct[]>;
  countOrdersToProcess(): Promise<number>;
  countOpenReturnRequests(): Promise<number>;
  countPendingDealers(): Promise<number>;
  lowStock(threshold: number, limit: number): Promise<LowStockItem[]>;
  customerMetrics(from: Date, to: Date): Promise<CustomerMetrics>;
  revenueRows(from: Date, to: Date): Promise<RevenueRow[]>;
  ingredientUsage(from: Date, to: Date): Promise<IngredientUsageRow[]>;
}

/** Türkiye saati (2016'dan beri sabit UTC+3, yaz saati yok). */
const TR_OFFSET_MS = 3 * 60 * 60 * 1000;
const MONTHS_SHORT_TR = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
] as const;

function trDateParts(date: Date): { y: number; m: number; d: number } {
  const local = new Date(date.getTime() + TR_OFFSET_MS);
  return {
    y: local.getUTCFullYear(),
    m: local.getUTCMonth(),
    d: local.getUTCDate(),
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Siparişleri Türkiye saatine göre gün (veya ay) sütunlarına toplar. Satışsız
 * günler de 0 olarak yer alır; böylece grafikte boşluk yanlış okunmaz.
 */
export function bucketRevenue(
  rows: readonly RevenueRow[],
  start: Date,
  end: Date,
  granularity: "day" | "month",
): RevenueBucket[] {
  const buckets = new Map<string, RevenueBucket & { sum: Decimal }>();
  const keyOf = (date: Date) => {
    const { y, m, d } = trDateParts(date);
    return granularity === "day"
      ? `${y}-${pad(m + 1)}-${pad(d)}`
      : `${y}-${pad(m + 1)}`;
  };

  // Başlangıçtan bitişe tüm sütunları sırayla aç.
  const { y, m, d } = trDateParts(start);
  const cursor = new Date(Date.UTC(y, m, granularity === "day" ? d : 1));
  const last = keyOf(end);
  for (let guard = 0; guard < 400; guard++) {
    const key =
      granularity === "day"
        ? `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`
        : `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}`;
    const month = MONTHS_SHORT_TR[cursor.getUTCMonth()]!;
    buckets.set(key, {
      key,
      label:
        granularity === "day"
          ? `${cursor.getUTCDate()} ${month}`
          : `${month} ${cursor.getUTCFullYear()}`,
      revenue: "0.00",
      orderCount: 0,
      sum: toDecimal(0),
    });
    if (key === last) break;
    if (granularity === "day") cursor.setUTCDate(cursor.getUTCDate() + 1);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  for (const row of rows) {
    const bucket = buckets.get(keyOf(row.createdAt));
    if (!bucket) continue;
    bucket.sum = bucket.sum.plus(row.grandTotal);
    bucket.orderCount += 1;
  }

  return [...buckets.values()].map(({ sum, ...bucket }) => ({
    ...bucket,
    revenue: sum.toFixed(2),
  }));
}

/**
 * "Kendi Turşunu Yap" sipariş satırlarından malzeme popülerliğini çıkarır.
 * Her malzeme, girdiği bidon sayısı (satır adedi) kadar sayılır.
 */
export function rankIngredients(
  rows: readonly IngredientUsageRow[],
  limit: number,
): { totalJars: number; items: PopularIngredient[] } {
  const counts = new Map<string, number>();
  let totalJars = 0;

  for (const row of rows) {
    const snapshot = row.customization as {
      kind?: unknown;
      ingredients?: { name?: unknown }[];
    } | null;
    if (
      snapshot?.kind !== "custom-pickle" ||
      !Array.isArray(snapshot.ingredients)
    ) {
      continue;
    }
    totalJars += row.quantity;
    const names = new Set(
      snapshot.ingredients
        .map((ingredient) => ingredient?.name)
        .filter(
          (name): name is string => typeof name === "string" && name !== "",
        ),
    );
    for (const name of names) {
      counts.set(name, (counts.get(name) ?? 0) + row.quantity);
    }
  }

  const items = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, limit)
    .map(([name, jarCount]) => ({
      name,
      jarCount,
      sharePercent:
        totalJars === 0 ? 0 : Math.round((jarCount / totalJars) * 100),
    }));

  return { totalJars, items };
}

/** Önceki döneme göre yüzde değişim; önceki dönem 0 ise karşılaştırılamaz (null). */
export function percentChange(
  current: Decimal.Value,
  previous: Decimal.Value,
): number | null {
  const prev = toDecimal(previous);
  if (prev.isZero()) return null;
  return toDecimal(current)
    .minus(prev)
    .dividedBy(prev)
    .times(100)
    .toDecimalPlaces(1)
    .toNumber();
}

const DAY_MS = 24 * 60 * 60 * 1000;

export class ReportingService {
  constructor(
    private readonly repository: ReportingRepository,
    private readonly lowStockThreshold: number,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async dashboard(periodDays = 30): Promise<DashboardData> {
    const end = this.now();
    const start = new Date(end.getTime() - periodDays * DAY_MS);
    const previousStart = new Date(start.getTime() - periodDays * DAY_MS);

    const [
      current,
      previous,
      topProducts,
      ordersToProcess,
      openReturnRequests,
      pendingDealers,
      lowStock,
      customers,
      previousCustomers,
      revenueRows,
      ingredientRows,
    ] = await Promise.all([
      this.repository.periodTotals(start, end),
      this.repository.periodTotals(previousStart, start),
      this.repository.topProducts(start, end, 5),
      this.repository.countOrdersToProcess(),
      this.repository.countOpenReturnRequests(),
      this.repository.countPendingDealers(),
      this.repository.lowStock(this.lowStockThreshold, 10),
      this.repository.customerMetrics(start, end),
      this.repository.customerMetrics(previousStart, start),
      this.repository.revenueRows(start, end),
      this.repository.ingredientUsage(start, end),
    ]);
    const granularity = periodDays > 90 ? "month" : "day";

    const average =
      current.orderCount === 0
        ? toDecimal(0)
        : current.revenue.dividedBy(current.orderCount);

    return {
      periodDays,
      customers: {
        ...customers,
        newChangePercent: percentChange(
          customers.newCustomers,
          previousCustomers.newCustomers,
        ),
        returningRate:
          customers.buyers === 0
            ? null
            : Math.round(
                (customers.returningBuyers / customers.buyers) * 1000,
              ) / 10,
      },
      revenue: {
        current: current.revenue.toFixed(2),
        previous: previous.revenue.toFixed(2),
        changePercent: percentChange(current.revenue, previous.revenue),
      },
      orders: {
        current: current.orderCount,
        previous: previous.orderCount,
        changePercent: percentChange(current.orderCount, previous.orderCount),
      },
      averageOrderValue: average.toFixed(2),
      revenueSeries: {
        granularity,
        buckets: bucketRevenue(revenueRows, start, end, granularity),
      },
      topProducts,
      popularIngredients: rankIngredients(ingredientRows, 8),
      attention: {
        ordersToProcess,
        openReturnRequests,
        pendingDealers,
        lowStock,
      },
    };
  }
}

/** Panoda seçilebilen dönemler (gün). */
export const REPORT_PERIODS = [7, 30, 90, 365] as const;
export const DEFAULT_REPORT_PERIOD = 30;

/** Sorgu dizgesinden gelen değeri izinli dönemlerden birine çevirir. */
export function parseReportPeriod(value: string | undefined): number {
  const parsed = Number(value);
  return (REPORT_PERIODS as readonly number[]).includes(parsed)
    ? parsed
    : DEFAULT_REPORT_PERIOD;
}
