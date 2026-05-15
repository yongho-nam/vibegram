import { useId } from "react";
import { BRAND_NAME } from "@/config/brand";
import styles from "./Logo.module.css";

type Props = { variant?: "full" | "glyph"; className?: string };

function GlyphLogo({ className }: { className?: string }) {
  const gradId = useId().replace(/:/g, "");
  return (
    <svg
      className={[styles.glyph, className].filter(Boolean).join(" ")}
      viewBox="0 0 24 24"
      aria-label={BRAND_NAME}
      role="img"
    >
      <title>{BRAND_NAME}</title>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f58529" />
          <stop offset="40%" stopColor="#dd2a7b" />
          <stop offset="100%" stopColor="#8134af" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.4.6.2 1 .5 1.5 1 .4.4.8.9 1 1.5.2.5.3 1.2.4 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.4-.2.6-.5 1-1 1.5-.4.4-.9.8-1.5 1-.5.2-1.2.3-2.4.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.5-1.5-1-.4-.4-.8-.9-1-1.5-.2-.5-.3-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.4.2-.6.5-1 1-1.5.4-.4.9-.8 1.5-1 .5-.2 1.2-.3 2.4-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.3-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.1.4-.2 1-.3 2.1C2.4 8.5 2.4 8.9 2.4 12s0 3.5.1 4.7c.1 1.1.2 1.7.3 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.1 1 .2 2.1.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.3.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.1-.4.2-1 .3-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c-.1-1.1-.2-1.7-.3-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.1-1-.2-2.1-.3-1.2-.1-1.6-.1-4.7-.1Zm0 3.2a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6Zm0 9.6a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6Zm6.4-9.9a1.36 1.36 0 1 1-2.72 0 1.36 1.36 0 0 1 2.72 0Z"
      />
    </svg>
  );
}

export function InstagramLogo({ variant = "full", className }: Props) {
  if (variant === "glyph") {
    return <GlyphLogo className={className} />;
  }
  return (
    <span
      className={[styles.wordmark, className].filter(Boolean).join(" ")}
      aria-label={BRAND_NAME}
      role="img"
    >
      {BRAND_NAME}
    </span>
  );
}
