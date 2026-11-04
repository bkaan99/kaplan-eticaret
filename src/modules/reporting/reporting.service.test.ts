import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";
import {
  ReportingService,
  bucketRevenue,
  parseReportPeriod,
  rankIngredients,
  percentChange,
  type ReportingRepository,
} from "./reporting.service";

describe("percentChange", () => {
  it("artışı ve azalışı hesaplar", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });

  it("önceki dönem sıfırsa karşılaştırılamaz", () => {
    expect(percentChange(100, 0)).toBeNull();
  });

  it("tek ondalığa yuvarlar", () => {
    expect(percentChange(133.33, 100)).toBe(33.3);
  });
});

describe("ReportingService.dashboard", () => {
  const repo = (
    current: [string, number],
    previous: [string, number],
  ): ReportingRepository => {
    const calls: { from: Date; to: Date }[] = [];
    return {
      periodTotals: async (from, to) => {
        calls.push({ from, to });
        const [revenue, orderCount] = calls.length === 1 ? current : previous;
        return { revenue: new Decimal(revenue), orderCount };
      },
      topProducts: async () => [
        { name: "Tişört", quantity: 3, revenue: "900.00" },
      ],
      countOrdersToProcess: async () => 4,
      countOpenReturnRequests: async () => 1,
      countPendingDealers: async () => 2,
      lowStock: async () => [
        { productName: "Cüzdan", sku: "C-1", available: 2 },
      ],
      customerMetrics: async () => ({
        newCustomers: 6,
        buyers: 8,
        returningBuyers: 3,
      }),
      revenueRows: async () => [
        { createdAt: new Date("2026-06-29T10:00:00Z"), grandTotal: "250.00" },
      ],
      ingredientUsage: async () => [],
    };
  };

  it("dönemleri karşılaştırır ve ortalama sepet tutarını hesaplar", async () => {
    const service = new ReportingService(
      repo(["3000.00", 6], ["2000.00", 4]),
      5,
      () => new Date("2026-06-30T00:00:00Z"),
    );

    const data = await service.dashboard(30);

    expect(data.revenue).toEqual({
      current: "3000.00",
      previous: "2000.00",
      changePercent: 50,
    });
    expect(data.orders).toEqual({ current: 6, previous: 4, changePercent: 50 });
    expect(data.averageOrderValue).toBe("500.00");
    expect(data.attention).toMatchObject({
      ordersToProcess: 4,
      openReturnRequests: 1,
      pendingDealers: 2,
    });
  });

  it("siparişsiz dönemde ortalama sıfırdır", async () => {
    const service = new ReportingService(repo(["0", 0], ["0", 0]), 5);
    expect((await service.dashboard()).averageOrderValue).toBe("0.00");
  });
});

describe("parseReportPeriod", () => {
  it("izinli dönemleri kabul eder, diğerlerini varsayılana çevirir", () => {
    expect(parseReportPeriod("7")).toBe(7);
    expect(parseReportPeriod("365")).toBe(365);
    expect(parseReportPeriod("15")).toBe(30);
    expect(parseReportPeriod(undefined)).toBe(30);
    expect(parseReportPeriod("abc")).toBe(30);
  });
});

describe("bucketRevenue", () => {
  const start = new Date("2026-06-01T00:00:00Z");
  const end = new Date("2026-06-04T12:00:00Z");

  it("satışsız günleri 0 ile doldurur ve Türkiye saatine göre gruplar", () => {
    const buckets = bucketRevenue(
      [
        { createdAt: new Date("2026-06-02T08:00:00Z"), grandTotal: "100.10" },
        { createdAt: new Date("2026-06-02T09:00:00Z"), grandTotal: "0.20" },
        // 22:30 UTC = ertesi gün 01:30 TR → 4 Haziran
        { createdAt: new Date("2026-06-03T22:30:00Z"), grandTotal: "50" },
      ],
      start,
      end,
      "day",
    );

    expect(buckets.map((b) => [b.key, b.revenue, b.orderCount])).toEqual([
      ["2026-06-01", "0.00", 0],
      ["2026-06-02", "100.30", 2],
      ["2026-06-03", "0.00", 0],
      ["2026-06-04", "50.00", 1],
    ]);
    expect(buckets[0]!.label).toBe("1 Haz");
  });

  it("aylık gruplamada ay sütunları üretir", () => {
    const buckets = bucketRevenue(
      [{ createdAt: new Date("2026-02-10T10:00:00Z"), grandTotal: "10" }],
      new Date("2026-01-15T00:00:00Z"),
      new Date("2026-03-02T00:00:00Z"),
      "month",
    );
    expect(buckets.map((b) => [b.key, b.label, b.revenue])).toEqual([
      ["2026-01", "Oca 2026", "0.00"],
      ["2026-02", "Şub 2026", "10.00"],
      ["2026-03", "Mar 2026", "0.00"],
    ]);
  });
});

describe("rankIngredients", () => {
  const jar = (quantity: number, names: string[]) => ({
    quantity,
    customization: {
      kind: "custom-pickle",
      ingredients: names.map((name, i) => ({
        id: String(i),
        name,
        unitExtra: "0",
      })),
    },
  });

  it("malzemeleri bidon adedine göre sıralar ve payını hesaplar", () => {
    const result = rankIngredients(
      [
        jar(2, ["Salatalık", "Biber"]),
        jar(1, ["Salatalık", "Lahana"]),
        { quantity: 5, customization: { kind: "gift-box" } },
      ],
      10,
    );
    expect(result.totalJars).toBe(3);
    expect(result.items).toEqual([
      { name: "Salatalık", jarCount: 3, sharePercent: 100 },
      { name: "Biber", jarCount: 2, sharePercent: 67 },
      { name: "Lahana", jarCount: 1, sharePercent: 33 },
    ]);
  });

  it("aynı bidonda tekrarlanan malzemeyi bir kez sayar ve limiti uygular", () => {
    const result = rankIngredients([jar(1, ["Biber", "Biber", "Havuç"])], 1);
    expect(result.items).toEqual([
      { name: "Biber", jarCount: 1, sharePercent: 100 },
    ]);
  });
});
