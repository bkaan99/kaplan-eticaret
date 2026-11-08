"use client";

export interface DiffField {
  key: string;
  beforeVal: unknown;
  afterVal: unknown;
  status: "added" | "removed" | "changed" | "unchanged";
}

export function calculateDiff(before: unknown, after: unknown): DiffField[] {
  if (!before && !after) return [];
  const bObj =
    typeof before === "object" && before !== null
      ? (before as Record<string, unknown>)
      : null;
  const aObj =
    typeof after === "object" && after !== null
      ? (after as Record<string, unknown>)
      : null;

  if (!bObj && aObj) {
    return Object.entries(aObj).map(([key, afterVal]) => ({
      key,
      beforeVal: undefined,
      afterVal,
      status: "added",
    }));
  }

  if (bObj && !aObj) {
    return Object.entries(bObj).map(([key, beforeVal]) => ({
      key,
      beforeVal,
      afterVal: undefined,
      status: "removed",
    }));
  }

  if (bObj && aObj) {
    const allKeys = Array.from(
      new Set([...Object.keys(bObj), ...Object.keys(aObj)]),
    );
    return allKeys.map((key) => {
      const bVal = bObj[key];
      const aVal = aObj[key];
      const bStr = JSON.stringify(bVal);
      const aStr = JSON.stringify(aVal);
      if (!(key in bObj))
        return { key, beforeVal: undefined, afterVal: aVal, status: "added" };
      if (!(key in aObj))
        return { key, beforeVal: bVal, afterVal: undefined, status: "removed" };
      if (bStr !== aStr)
        return { key, beforeVal: bVal, afterVal: aVal, status: "changed" };
      return { key, beforeVal: bVal, afterVal: aVal, status: "unchanged" };
    });
  }

  return [];
}

export function formatValue(val: unknown): string {
  if (val === undefined) return "–";
  if (val === null) return "null";
  if (typeof val === "boolean") return val ? "true (Evet)" : "false (Hayır)";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

export function getActionBadge(action: string) {
  const lower = action.toLowerCase();
  if (
    lower.includes("create") ||
    lower.includes("add") ||
    lower.includes("insert")
  ) {
    return {
      label: "Ekleme",
      icon: "✨",
      className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    };
  }
  if (
    lower.includes("delete") ||
    lower.includes("remove") ||
    lower.includes("cancel")
  ) {
    return {
      label: "Silme",
      icon: "🗑️",
      className: "bg-red-50 text-red-800 border-red-200",
    };
  }
  if (
    lower.includes("update") ||
    lower.includes("edit") ||
    lower.includes("change") ||
    lower.includes("set")
  ) {
    return {
      label: "Güncelleme",
      icon: "✎",
      className: "bg-sky-50 text-sky-800 border-sky-200",
    };
  }
  if (lower.includes("ship") || lower.includes("deliver")) {
    return {
      label: "Sevkiyat",
      icon: "🚚",
      className: "bg-amber-50 text-amber-800 border-amber-200",
    };
  }
  if (
    lower.includes("auth") ||
    lower.includes("login") ||
    lower.includes("role") ||
    lower.includes("pass")
  ) {
    return {
      label: "Güvenlik",
      icon: "🔐",
      className: "bg-purple-50 text-purple-800 border-purple-200",
    };
  }
  return {
    label: "İşlem",
    icon: "⚙️",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };
}
