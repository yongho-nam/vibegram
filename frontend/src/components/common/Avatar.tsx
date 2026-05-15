import type { ImgHTMLAttributes } from "react";
import styles from "./Avatar.module.css";

type Props = {
  src: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: "story" | "story-seen" | "none";
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height">;

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  xs: styles.xs!,
  sm: styles.sm!,
  md: styles.md!,
  lg: styles.lg!,
  xl: styles.xl!,
};

export function Avatar({ src, alt, size = "md", ring = "none", className, ...rest }: Props) {
  const resolvedSize = size ?? "md";
  return (
    <span
      className={[
        styles.wrap,
        sizeClass[resolvedSize],
        ring === "story" ? styles.ringStory : "",
        ring === "story-seen" ? styles.ringSeen : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img src={src} alt={alt} className={styles.img} draggable={false} {...rest} />
    </span>
  );
}
