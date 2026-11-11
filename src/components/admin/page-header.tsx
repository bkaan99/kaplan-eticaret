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
    <header className="mb-4 flex flex-col gap-3 border-b border-slate-200/70 pb-4 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-[1.375rem]">
          {title}
        </h1>
        {description ? (
          <p className="text-[12px] leading-relaxed text-slate-500 sm:text-[13px]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end [&>*]:min-h-10 [&>*]:justify-center sm:[&>*]:min-h-9">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
