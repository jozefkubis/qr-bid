import type { ComponentPropsWithoutRef } from "react";

type CardProps = ComponentPropsWithoutRef<"div">;

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-soft border border-border bg-surface p-6 shadow-soft ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
