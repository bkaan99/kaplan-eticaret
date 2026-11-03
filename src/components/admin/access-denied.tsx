import Link from "next/link";

export function AccessDenied() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-7 py-10 text-center shadow-2xs">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-slate-900">
          Erişim yetkiniz yok
        </h1>
        <p className="text-[13px] text-slate-500">
          Bu sayfayı görüntülemek için gerekli yetkiye sahip değilsiniz. Gerekirse
          yöneticinizden rolünüzü güncellemesini isteyin.
        </p>
      </div>
      <Link
        href="/admin"
        className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-3.5 text-[13px] font-medium text-white transition hover:bg-primary"
      >
        Panele dön
      </Link>
    </div>
  );
}
