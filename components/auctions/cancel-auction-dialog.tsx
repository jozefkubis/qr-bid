"use client";

import { useTranslations } from "next-intl";
import { useActionState, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cancellationReasonLimit, type CancelAuctionState } from "@/lib/auction-cancellation";

export function CancelAuctionDialog({
  action,
}: {
  action: (state: CancelAuctionState, data: FormData) => Promise<CancelAuctionState>;
}) {
  const t = useTranslations("AuctionCancellation");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reasonId = useId();
  const [reason, setReason] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [state, submitAction, pending] = useActionState(action, {});
  const tooLong = Array.from(reason.trim()).length > cancellationReasonLimit;
  const invalid = tooLong || (attempted && !reason.trim());
  const visibleStatus = attempted && !pending ? state.status : undefined;
  const fieldError = invalid || visibleStatus === "invalidReason"
    ? t("invalidReason", { limit: cancellationReasonLimit })
    : undefined;
  const serverError = visibleStatus === "failed" || visibleStatus === "unavailable"
    ? t(visibleStatus)
    : undefined;

  return (
    <>
      <Button
        variant="secondary"
        className="mt-4 border-error text-error"
        onClick={() => {
          setAttempted(false);
          dialog.current?.showModal();
        }}
      >
        {t("open")}
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="fixed inset-x-0 bottom-0 m-0 max-h-[90dvh] w-full max-w-none overflow-auto rounded-t-2xl border border-border bg-surface p-0 text-foreground shadow-soft backdrop:bg-black/50 sm:inset-0 sm:m-auto sm:max-w-lg sm:rounded-2xl"
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <form
          action={submitAction}
          noValidate
          className="flex max-h-[90dvh] flex-col"
          onSubmit={(event) => {
            setAttempted(true);
            if (pending || tooLong || !reason.trim()) event.preventDefault();
          }}
        >
          <div className="grid gap-4 overflow-y-auto p-5 sm:p-6">
            <h2 id={titleId} className="text-xl font-semibold">{t("title")}</h2>
            <p id={descriptionId} className="text-sm text-muted-foreground">{t("warning")}</p>
            <Textarea
              id={reasonId}
              name="reason"
              label={t("reason")}
              helpText={t("publicWarning")}
              error={fieldError}
              required
              readOnly={pending}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setAttempted(false);
              }}
            />
            <p className="text-xs text-muted-foreground">{t("limit", { limit: cancellationReasonLimit })}</p>
            {fieldError || serverError ? <p role="alert" className={fieldError ? "sr-only" : "text-sm font-semibold text-error"}>{fieldError ?? serverError}</p> : null}
          </div>
          <div className="grid gap-2 border-t border-border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:p-6">
            <Button variant="secondary" disabled={pending} onClick={() => dialog.current?.close()}>{t("back")}</Button>
            <Button type="submit" isLoading={pending}>{t(pending ? "pending" : "confirm")}</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
