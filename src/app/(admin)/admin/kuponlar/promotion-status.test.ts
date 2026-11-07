import { describe, expect, it } from "vitest";
import {
  endsSoon,
  isoToLocalInput,
  localInputToIso,
  promotionStatus,
} from "./promotion-status";

const now = new Date("2026-11-05T12:00:00Z");
const base = { isActive: true, startsAt: null, endsAt: null };

describe("promotionStatus", () => {
  it("ödemedeki kontrollerle aynı sırayı izler", () => {
    expect(promotionStatus(base, now)).toBe("active");
    expect(
      promotionStatus(
        { ...base, isActive: false, endsAt: "2020-01-01T00:00:00Z" },
        now,
      ),
    ).toBe("inactive");
    expect(
      promotionStatus({ ...base, startsAt: "2026-12-01T00:00:00Z" }, now),
    ).toBe("scheduled");
    expect(
      promotionStatus({ ...base, endsAt: "2026-11-05T11:59:00Z" }, now),
    ).toBe("expired");
    expect(
      promotionStatus({ ...base, usedCount: 100, maxUses: 100 }, now),
    ).toBe("exhausted");
    expect(promotionStatus({ ...base, usedCount: 99, maxUses: 100 }, now)).toBe(
      "active",
    );
  });

  it("kotasız kampanyada kullanım sayısını yok sayar", () => {
    expect(
      promotionStatus({ ...base, maxUses: null, usedCount: 5000 }, now),
    ).toBe("active");
  });
});

describe("endsSoon", () => {
  it("yalnızca aktif ve 7 gün içinde bitenleri işaretler", () => {
    const soon = { endsAt: "2026-11-10T12:00:00Z" };
    expect(endsSoon(soon, "active", now)).toBe(true);
    expect(endsSoon({ endsAt: "2026-11-20T12:00:00Z" }, "active", now)).toBe(
      false,
    );
    expect(endsSoon(soon, "inactive", now)).toBe(false);
    expect(endsSoon({ endsAt: null }, "active", now)).toBe(false);
  });
});

describe("yerel tarih dönüşümü", () => {
  it("datetime-local değeri ile ISO arasında kayıpsız gidip gelir", () => {
    const local = "2026-11-05T23:59";
    expect(isoToLocalInput(localInputToIso(local))).toBe(local);
  });

  it("boş değerleri korur", () => {
    expect(localInputToIso("")).toBe("");
    expect(isoToLocalInput(null)).toBe("");
  });

  it("Türkiye saatiyle girilen bitişi doğru UTC anına çevirir", () => {
    const previous = process.env.TZ;
    process.env.TZ = "Europe/Istanbul";
    try {
      expect(localInputToIso("2026-11-05T23:59")).toBe(
        "2026-11-05T20:59:00.000Z",
      );
    } finally {
      process.env.TZ = previous;
    }
  });
});
