import type { SVGProps } from "react";

/** Vitrin ikonları (çizgi stili, currentColor). */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
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
      {...props}
    >
      {children}
    </svg>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Icon>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Icon>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </Icon>
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
  );
}

export function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 8h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </Icon>
  );
}

export function ArrowRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  );
}

export function LeafIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15" />
      <path d="M5 19 13 11" />
    </Icon>
  );
}

export function TruckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Icon>
  );
}

export function JarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M7 3h10v3H7z" />
      <path d="M6 6h12a1 1 0 0 1 1 1v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1z" />
      <path d="M8 12h8v4H8z" />
    </Icon>
  );
}

/** Turşu bidonu (kulplu bidon silüeti). */
export function BidonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      {/* Kapak */}
      <path d="M9 2.5h6v2.5H9z" />
      {/* Gövde + yan kulplar */}
      <path d="M9 5h6v1.8c0 1.1 1.2 1.7 2.6 1.9 1.5.2 2.4 1.2 2.4 2.5v8.8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V11.2c0-1.3.9-2.3 2.4-2.5C7.8 8.5 9 7.9 9 6.8V5z" />
      {/* Etiket */}
      <path d="M8 13h8v3.5H8z" />
    </Icon>
  );
}

/**
 * Statik mini bidon — builder sayfasındaki tombik kavanoz + sarı vida kapak.
 * Buton/CTA thumb için; animasyon/malzeme yok.
 */
export function BidonThumb({
  className,
  width = 22,
  height = 26,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 58"
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
      {...props}
    >
      <ellipse cx="24" cy="54" rx="16" ry="2.2" fill="#0b2318" opacity="0.14" />
      {/* Gövde — köşeli omuzlu şeffaf bidon */}
      <path d="M17 15 H31 L39 23 V46 L35 51 H13 L9 46 V23 Z" fill="#f4f6f2" />
      {/* Dikiş çizgileri + yansıma */}
      <path d="M17.5 24 V45 M30.5 24 V45" stroke="#c3cabd" strokeWidth="0.9" />
      <path
        d="M11.8 25 V44"
        stroke="#ffffff"
        strokeOpacity="0.8"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Etiket */}
      <rect
        x="14"
        y="31"
        width="20"
        height="8"
        rx="1"
        fill="#f8f7ee"
        stroke="#1f5a27"
        strokeWidth="0.9"
      />
      <path
        d="M18 34.5 H30 M20 36.8 H28"
        stroke="#1f5a27"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <path
        d="M17 15 H31 L39 23 V46 L35 51 H13 L9 46 V23 Z"
        fill="none"
        stroke="#aeb6a9"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      {/* Boyun */}
      <rect
        x="16"
        y="12.5"
        width="16"
        height="3"
        rx="0.6"
        fill="#eceee9"
        stroke="#b4bbae"
        strokeWidth="0.6"
      />
      {/* Kapak — yeşil vida */}
      <path
        d="M14.5 13 V7 Q14.5 5 16.5 5 H31.5 Q33.5 5 33.5 7 V13 Z"
        fill="#1d5524"
      />
      <path
        d="M14.5 8 V7 Q14.5 5 16.5 5 H31.5 Q33.5 5 33.5 7 V8 Z"
        fill="#3f8a48"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect
          key={i}
          x={16.2 + i * 2.9}
          y="8.8"
          width="0.9"
          height="3.6"
          rx="0.4"
          fill="#0b2a10"
          opacity="0.3"
        />
      ))}
    </svg>
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  );
}

export function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </Icon>
  );
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </Icon>
  );
}

export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}
