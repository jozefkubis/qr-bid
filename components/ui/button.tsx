import type { ComponentPropsWithoutRef } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  isLoading?: boolean;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-primary bg-primary text-white hover:border-primary-hover hover:bg-primary-hover",
  secondary:
    "border-primary bg-surface text-primary hover:bg-surface-muted",
};

export function Button({
  children,
  className = "",
  disabled = false,
  isLoading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-soft border px-5 py-2.5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
        />
      ) : null}
      {children}
    </button>
  );
}
