"use client";

export const toLocalInput = (iso: string | null) =>
  iso ? iso.slice(0, 16) : "";

export function Notice({
  message,
  onDismiss,
}: {
  message: { text: string; error: boolean } | null;
  onDismiss?: () => void;
}) {
  if (!message) return null;
  return (
    <div
      role={message.error ? "alert" : "status"}
      className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs font-semibold transition-all ${
        message.error
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <span>{message.error ? "⚠️" : "✓"}</span>
        <span>{message.text}</span>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
