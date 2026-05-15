import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { active?: boolean };

const stroke = (p: IconProps) => ({
  fill: p.active ? "currentColor" : "none",
  stroke: "currentColor",
  strokeWidth: p.active ? 0 : 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function IconHome({ active, ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active, ...p })}>
      {active ? (
        <path d="M22 10.5V20a2 2 0 0 1-2 2h-5v-7H9v7H4a2 2 0 0 1-2-2v-9.5L12 3l10 7.5Z" />
      ) : (
        <>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </>
      )}
    </svg>
  );
}

export function IconSearch({ active, ...p }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={24}
      height={24}
      aria-hidden
      {...p}
      fill="none"
      stroke="currentColor"
      strokeWidth={active ? 2.6 : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={11} cy={11} r={7} />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function IconExplore({ active, ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active, ...p })}>
      {active ? (
        <path
          fill="currentColor"
          d="M12 2 2 7l10 5 10-5-10-5Zm0 9 2.5-5L22 7v10l-9.5 5L12 17l-2.5 5L2 17V7l7.5-1L12 11Z"
        />
      ) : (
        <>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </>
      )}
    </svg>
  );
}

export function IconReels({ active, ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active, ...p })}>
      <rect x={2} y={3} width={20} height={18} rx={4} />
      <path d="m10 9 5 3-5 3V9Z" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

export function IconSend({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <line x1={22} y1={2} x2={11} y2={13} />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

export function IconHeart({ active, filled, ...p }: IconProps & { filled?: boolean }) {
  if (filled || active) {
    return (
      <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p}>
        <path
          fill="var(--ig-like)"
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

export function IconComment({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
    </svg>
  );
}

export function IconSave({ active, ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active, ...p })}>
      {active ? (
        <path fill="currentColor" d="M17 3H7a2 2 0 0 0-2 2v16l7-4 7 4V5a2 2 0 0 0-2-2Z" />
      ) : (
        <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />
      )}
    </svg>
  );
}

export function IconMore({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <circle cx={12} cy={12} r={1} fill="currentColor" stroke="none" />
      <circle cx={6} cy={12} r={1} fill="currentColor" stroke="none" />
      <circle cx={18} cy={12} r={1} fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPlusSquare({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <rect x={3} y={3} width={18} height={18} rx={4} />
      <line x1={12} y1={8} x2={12} y2={16} />
      <line x1={8} y1={12} x2={16} y2={12} />
    </svg>
  );
}

export function IconMenu({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <line x1={3} y1={6} x2={21} y2={6} />
      <line x1={3} y1={12} x2={21} y2={12} />
      <line x1={3} y1={18} x2={21} y2={18} />
    </svg>
  );
}

export function IconChevronLeft({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function IconClose({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <line x1={18} y1={6} x2={6} y2={18} />
      <line x1={6} y1={6} x2={18} y2={18} />
    </svg>
  );
}

export function IconCamera({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={96} height={96} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx={12} cy={13} r={4} />
    </svg>
  );
}

export function IconNewMessage({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden {...p} {...stroke({ active: false, ...p })}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </svg>
  );
}

export function IconVerified({ ...p }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden {...p}>
      <path
        fill="var(--ig-link)"
        d="M12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 22 12 18.27 18.18 22l-1.64-8.03L22 9.24l-7.19-.61L12 2Z"
      />
    </svg>
  );
}
