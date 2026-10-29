import React from "react";

export const inputClass =
  "w-full rounded-theme border border-border px-3 py-2 text-sm";

export function Field({
  label,
  name,
  errors,
  children,
}: {
  label: string;
  name: string;
  errors?: Record<string, string>;
  children: React.ReactNode;
}) {
  const error = errors?.[name];

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span>{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}
