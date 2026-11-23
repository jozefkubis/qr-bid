"use client";

import { Check, CircleAlert, Gavel } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { BidActionState } from "@/lib/bid-action-state";
import { initialBidActionState } from "@/lib/bid-action-state";

type Props = {
  action: (state: BidActionState, formData: FormData) => Promise<BidActionState>;
  auctionId: string;
  bidCount: number;
  currentHighestMinor: number | null;
  ended: boolean;
  isOwner: boolean;
  locale: string;
  minimumIncrementMinor: number;
  minimumNextBidMinor: number;
  signedIn: boolean;
};

type Confirmation = {
  amountMinor: number;
  minimumAtReviewMinor: number;
  requestId: string;
};

type SuccessFeedback = {
  amountMinor: number;
  minimumNextBidMinor: number;
  replayed: boolean;
};

function decimalToMinor(value: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return null;

  const [whole, fraction = ""] = value.trim().replace(",", ".").split(".");
  const minor = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));

  return minor >= BigInt(1) && minor <= BigInt(Number.MAX_SAFE_INTEGER)
    ? Number(minor)
    : null;
}

export function LiveBiddingPanel(props: Props) {
  const t = useTranslations("LiveBidding");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    props.action,
    initialBidActionState,
  );
  const [customAmount, setCustomAmount] = useState<string>();
  const [customError, setCustomError] = useState<string>();
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number>();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [successFeedback, setSuccessFeedback] = useState<SuccessFeedback>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const handledRequestRef = useRef<string | undefined>(undefined);
  const language = props.locale === "sk" ? "sk-SK" : "en-IE";
  const money = new Intl.NumberFormat(language, {
    style: "currency",
    currency: "EUR",
  });
  const displayedCustomAmount =
    customAmount ?? (props.minimumNextBidMinor / 100).toFixed(2);

  const quickAmounts =
    props.bidCount === 0
      ? [props.minimumNextBidMinor]
      : [1, 2, 3].map(
          (multiple) =>
            (props.currentHighestMinor ?? 0) +
            props.minimumIncrementMinor * multiple,
        );
  const confirmationStatus =
    confirmation && state.requestId === confirmation.requestId
      ? state.status
      : undefined;
  const effectiveMinimumMinor = Math.max(
    props.minimumNextBidMinor,
    confirmationStatus === "bid_too_low"
      ? (state.minimumNextBidMinor ?? 0)
      : 0,
  );
  const amountMeetsMinimum = confirmation
    ? confirmation.amountMinor >= effectiveMinimumMinor
    : false;
  const submissionBlocked =
    props.isOwner ||
    props.ended ||
    confirmationStatus === "ended" ||
    !amountMeetsMinimum;

  useEffect(() => {
    const dialog = dialogRef.current;

    if (confirmation && dialog && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
    }
  }, [confirmation]);

  useEffect(() => {
    const succeeded = state.status === "accepted" || state.status === "replayed";

    if (
      !succeeded ||
      !confirmation ||
      state.requestId !== confirmation.requestId ||
      handledRequestRef.current === confirmation.requestId
    ) {
      return;
    }

    handledRequestRef.current = confirmation.requestId;
    const nextMinimum =
      state.minimumNextBidMinor ?? props.minimumNextBidMinor;

    setSuccessFeedback({
      amountMinor: confirmation.amountMinor,
      minimumNextBidMinor: nextMinimum,
      replayed: state.status === "replayed",
    });
    setSelectedQuickAmount(undefined);
    setCustomAmount(undefined);
    dialogRef.current?.close();
    setConfirmation(undefined);
    requestAnimationFrame(() => openerRef.current?.focus());
    router.refresh();
  }, [confirmation, props.minimumNextBidMinor, router, state]);

  function openConfirmation(amountMinor: number, opener: HTMLElement) {
    openerRef.current = opener;
    setCustomError(undefined);
    setSuccessFeedback(undefined);
    setConfirmation({
      amountMinor,
      minimumAtReviewMinor: props.minimumNextBidMinor,
      requestId: crypto.randomUUID(),
    });
  }

  function prepareQuick(
    amountMinor: number,
    event: MouseEvent<HTMLButtonElement>,
  ) {
    setSelectedQuickAmount(amountMinor);
    openConfirmation(amountMinor, event.currentTarget);
  }

  function prepareCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountMinor = decimalToMinor(displayedCustomAmount);

    if (amountMinor === null) {
      setCustomError(t("customInvalid"));
      return;
    }

    if (amountMinor < props.minimumNextBidMinor) {
      setCustomError(
        t("customTooLow", {
          minimum: money.format(props.minimumNextBidMinor / 100),
        }),
      );
      return;
    }

    setSelectedQuickAmount(undefined);
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : event.currentTarget;
    openConfirmation(amountMinor, opener);
  }

  function closeConfirmation() {
    if (pending) return;

    dialogRef.current?.close();
    setConfirmation(undefined);
    requestAnimationFrame(() => openerRef.current?.focus());
  }

  if (props.ended && !confirmation) {
    return (
      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="mt-2 text-muted-foreground">{t("ended")}</p>
      </Card>
    );
  }

  if (!props.signedIn) {
    return (
      <Card className="p-5 sm:p-6">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="mt-2 text-muted-foreground">
          {t("signInDescription")}
        </p>
        <a
          href={`/${props.locale}/sign-in?redirect_url=${encodeURIComponent(`/${props.locale}/auctions/${props.auctionId}`)}`}
          className="mt-5 inline-flex min-h-11 items-center rounded-soft bg-primary px-5 py-2.5 font-semibold text-white"
        >
          {t("signIn")}
        </a>
      </Card>
    );
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{t("title")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("minimum", {
          amount: money.format(props.minimumNextBidMinor / 100),
        })}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {quickAmounts.map((amount, index) => {
          const selected = selectedQuickAmount === amount;

          return (
            <Button
              key={amount}
              variant={selected ? "primary" : "secondary"}
              aria-pressed={selected}
              className="flex-1 justify-between sm:flex-none"
              onClick={(event) => prepareQuick(amount, event)}
            >
              <span className="grid text-left leading-tight">
                <span>{money.format(amount / 100)}</span>
                {props.bidCount > 0 ? (
                  <span className="text-xs font-normal opacity-80">
                    {t("increase", {
                      amount: money.format(
                        (props.minimumIncrementMinor * (index + 1)) / 100,
                      ),
                    })}
                  </span>
                ) : null}
              </span>
              {selected ? (
                <Check className="size-4 shrink-0" aria-hidden="true" />
              ) : null}
            </Button>
          );
        })}
      </div>

      <form
        onSubmit={prepareCustom}
        className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <Input
          id="custom-bid"
          type="text"
          inputMode="decimal"
          required
          label={t("customLabel")}
          value={displayedCustomAmount}
          helpText={t("minimum", {
            amount: money.format(props.minimumNextBidMinor / 100),
          })}
          error={customError}
          onChange={(event) => {
            setCustomAmount(event.target.value);
            setSelectedQuickAmount(undefined);
            setCustomError(undefined);
          }}
        />
        <Button type="submit">{t("review")}</Button>
      </form>

      {successFeedback ? (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-soft bg-primary/10 p-3 text-sm font-semibold text-primary"
        >
          {t(
            successFeedback.replayed
              ? "status.replayed"
              : "status.accepted",
            {
              amount: money.format(successFeedback.amountMinor / 100),
              minimum: money.format(
                successFeedback.minimumNextBidMinor / 100,
              ),
            },
          )}
        </p>
      ) : null}

      {confirmation ? (
        <dialog
          ref={dialogRef}
          aria-labelledby="bid-confirmation-title"
          onCancel={(event) => {
            event.preventDefault();
            closeConfirmation();
          }}
          className="fixed inset-x-0 bottom-0 top-auto m-0 hidden max-h-[calc(100dvh-1rem)] w-full max-w-none flex-col rounded-t-[1.25rem] border border-border bg-surface p-5 text-foreground shadow-xl backdrop:bg-black/50 open:flex sm:inset-0 sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-lg sm:rounded-soft sm:p-6"
        >
          <form action={formAction} className="flex min-h-0 flex-col">
            <h3
              id="bid-confirmation-title"
              className="text-xl font-semibold"
            >
              {props.isOwner ? t("ownerModalTitle") : t("confirmTitle")}
            </h3>

            {props.isOwner ? (
              <div
                role="alert"
                className="mt-4 flex items-start gap-3 rounded-soft border border-error/30 bg-error/10 p-4 text-error"
              >
                <CircleAlert
                  className="mt-0.5 size-5 shrink-0"
                  aria-hidden="true"
                />
                <p className="font-semibold">{t("ownerModalDescription")}</p>
              </div>
            ) : (
              <>
                <p className="mt-3 text-muted-foreground">
                  {t("confirmAmount", {
                    amount: money.format(confirmation.amountMinor / 100),
                  })}
                </p>
                <p className="mt-2 text-3xl font-bold text-primary">
                  {money.format(confirmation.amountMinor / 100)}
                </p>
              </>
            )}

            {!props.isOwner ? <div className="mt-4 min-h-0 overflow-y-auto">
              <p className="text-sm text-muted-foreground">
                {t("confirmDescription")}
              </p>

              {confirmation.minimumAtReviewMinor !==
              props.minimumNextBidMinor ? (
                <p
                  role="status"
                  className="mt-3 rounded-soft bg-tertiary/15 p-3 text-sm font-semibold"
                >
                  {t("minimumChanged", {
                    minimum: money.format(
                      props.minimumNextBidMinor / 100,
                    ),
                  })}
                </p>
              ) : null}

              {!amountMeetsMinimum ? (
                <p
                  role="alert"
                  className="mt-3 rounded-soft bg-error/10 p-3 text-sm font-semibold text-error"
                >
                  {t("amountBelowMinimum", {
                    minimum: money.format(effectiveMinimumMinor / 100),
                  })}
                </p>
              ) : null}

              {props.ended && confirmationStatus !== "ended" ? (
                <p
                  role="alert"
                  className="mt-3 rounded-soft bg-error/10 p-3 text-sm font-semibold text-error"
                >
                  {t("status.ended")}
                </p>
              ) : null}

              {confirmationStatus &&
              confirmationStatus !== "accepted" &&
              confirmationStatus !== "replayed" &&
              confirmationStatus !== "bid_too_low" ? (
                <p
                  role="alert"
                  className="mt-3 rounded-soft bg-error/10 p-3 text-sm font-semibold text-error"
                >
                  {t(`status.${confirmationStatus}`, {
                    amount: money.format(confirmation.amountMinor / 100),
                    minimum: money.format(effectiveMinimumMinor / 100),
                  })}
                </p>
              ) : null}
            </div> : null}

            <input
              type="hidden"
              name="amountMinor"
              value={confirmation.amountMinor}
            />
            <input
              type="hidden"
              name="requestId"
              value={confirmation.requestId}
            />

            <div className={`mt-5 grid shrink-0 gap-3 bg-surface pb-[max(0px,env(safe-area-inset-bottom))] ${props.isOwner ? "" : "sm:grid-cols-2"}`}>
              {!props.isOwner ? (
                <Button
                  type="submit"
                  isLoading={pending}
                  disabled={submissionBlocked}
                >
                  <Gavel className="size-4" aria-hidden="true" />
                  {pending
                    ? t("submitting")
                    : t("confirmAction", {
                        amount: money.format(confirmation.amountMinor / 100),
                      })}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={closeConfirmation}
              >
                {t("back")}
              </Button>
            </div>
          </form>
        </dialog>
      ) : null}
    </Card>
  );
}
