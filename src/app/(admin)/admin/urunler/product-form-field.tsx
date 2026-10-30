import { Label } from "@/components/ui/label";

export function Field({
  label,
  error,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-bold text-slate-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        {hint && <span className="text-[11px] text-slate-400 font-medium">{hint}</span>}
      </div>
      {children}
      {error ? (
        <span role="alert" className="text-xs font-medium text-red-600">
          {error}
        </span>
      ) : null}
    </div>
  );
}
