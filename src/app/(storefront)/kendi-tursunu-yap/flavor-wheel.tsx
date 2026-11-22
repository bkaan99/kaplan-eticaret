import type { FlavorMeter } from "./flavor-profile";

const SHORT: Record<string, string> = {
  Ekşilik: "Ekşi",
  Acılık: "Acı",
  Çıtırlık: "Çıtır",
  Renk: "Renkli",
};

/** Lezzet çarkı: dört eksenli radar; dolu alan karışımın karakterini gösterir. */
export function FlavorWheel({ meters }: { meters: FlavorMeter[] | null }) {
  const cx = 100;
  const cy = 82;
  const radius = 52;
  const axes = [-90, 0, 90, 180].map((deg) => (deg * Math.PI) / 180);
  const point = (axis: number, ratio: number) =>
    `${(cx + Math.cos(axis) * radius * ratio).toFixed(1)},${(cy + Math.sin(axis) * radius * ratio).toFixed(1)}`;

  const values = axes.map((_, index) =>
    meters ? Math.max(0.06, meters[index]?.value ?? 0) : 0.06,
  );
  const shape = axes
    .map((axis, index) => point(axis, values[index]!))
    .join(" ");
  const labelPos = [
    { x: cx, y: 14, anchor: "middle" as const },
    { x: cx + radius + 8, y: cy + 3, anchor: "start" as const },
    { x: cx, y: cy + radius + 16, anchor: "middle" as const },
    { x: cx - radius - 8, y: cy + 3, anchor: "end" as const },
  ];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 200 170"
        role="img"
        aria-label={
          meters
            ? `Lezzet çarkı: ${meters.map((m) => `${m.label} ${m.text}`).join(", ")}`
            : "Lezzet çarkı: malzeme seçince dolar"
        }
        className="w-full max-w-[15rem]"
      >
        {[1 / 3, 2 / 3, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={axes.map((axis) => point(axis, ratio)).join(" ")}
            fill="none"
            stroke="#d9dfcf"
            strokeWidth="1"
          />
        ))}
        {axes.map((axis, index) => (
          <line
            key={index}
            x1={cx}
            y1={cy}
            x2={point(axis, 1).split(",")[0]}
            y2={point(axis, 1).split(",")[1]}
            stroke="#d9dfcf"
            strokeWidth="1"
          />
        ))}
        <polygon
          points={shape}
          fill="#15803d"
          fillOpacity={meters ? 0.28 : 0.08}
          stroke="#154734"
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ transition: "all 300ms ease" }}
        />
        {axes.map((axis, index) => {
          const [x, y] = point(axis, values[index]!).split(",");
          return <circle key={index} cx={x} cy={y} r="3" fill="#154734" />;
        })}
        {labelPos.map((pos, index) => (
          <text
            key={index}
            x={pos.x}
            y={pos.y}
            textAnchor={pos.anchor}
            fontSize="10"
            fontWeight="700"
            fill="#154734"
          >
            {SHORT[meters?.[index]?.label ?? ""] ??
              ["Ekşi", "Acı", "Çıtır", "Renkli"][index]}
          </text>
        ))}
      </svg>
      {meters ? (
        <ul className="flex flex-wrap justify-center gap-1.5">
          {meters.map((meter) => (
            <li
              key={meter.label}
              className="rounded-full bg-[#f4f5f0] px-2.5 py-1 text-[11px] font-semibold text-primary"
            >
              {meter.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
