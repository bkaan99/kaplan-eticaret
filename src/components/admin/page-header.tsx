export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/70 pb-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-[1.375rem]">
          {title}
        </h1>
        {description ? (
          <p className="text-[13px] text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
