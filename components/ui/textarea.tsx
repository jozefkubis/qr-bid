import type { ComponentPropsWithoutRef, ReactNode } from "react";

type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  error?: string;
  helpText?: string;
  id: string;
  label: ReactNode;
};

export function Textarea({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className = "",
  error,
  helpText,
  id,
  label,
  required,
  rows = 4,
  ...props
}: TextareaProps) {
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
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : ariaInvalid}
        className={`min-h-28 w-full resize-y rounded-soft border bg-surface px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground transition-colors focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground ${error ? "border-error" : "border-border"} ${className}`}
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
