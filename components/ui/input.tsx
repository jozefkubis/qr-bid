import type { ComponentPropsWithoutRef, ReactNode } from "react";

type InputProps = ComponentPropsWithoutRef<"input"> & {
  error?: string;
  helpText?: string;
  id: string;
  label: ReactNode;
};

export function Input({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className = "",
  error,
  helpText,
  id,
  label,
  required,
  type = "text",
  ...props
}: InputProps) {
  const helpTextId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [ariaDescribedBy, helpTextId, errorId]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="font-semibold text-foreground">
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-error">
            *
          </span>
        ) : null}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={`min-h-11 w-full rounded-soft border bg-surface px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground ${error ? "border-error" : "border-border"} ${className}`}
        {...props}
      />
      {helpText ? (
        <p id={helpTextId} className="text-sm text-muted-foreground">
          {helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm font-semibold text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
