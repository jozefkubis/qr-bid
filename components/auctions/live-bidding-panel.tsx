"use client";

import { Gavel } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, type FormEvent } from "react";
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
  locale: string;
  minimumIncrementMinor: number;
  minimumNextBidMinor: number;
  signedIn: boolean;
};

function decimalToMinor(value: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().replace(",", ".").split(".");
  const minor = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return minor >= BigInt(1) && minor <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(minor) : null;
}

export function LiveBiddingPanel(props: Props) {
  const t = useTranslations("LiveBidding");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(props.action, initialBidActionState);
  const [customAmount, setCustomAmount] = useState((props.minimumNextBidMinor / 100).toFixed(2));
  const [confirmation, setConfirmation] = useState<{ amountMinor: number; minimumAtReviewMinor: number; requestId: string } | null>(null);
  const language = props.locale === "sk" ? "sk-SK" : "en-IE";
  const money = new Intl.NumberFormat(language, { style: "currency", currency: "EUR" });

  useEffect(() => {
    if (state.status === "accepted" || state.status === "replayed") {
      router.refresh();
    }
  }, [router, state.status]);

  function prepare(amountMinor: number) {
    setConfirmation({ amountMinor, minimumAtReviewMinor: props.minimumNextBidMinor, requestId: crypto.randomUUID() });
  }

  function prepareCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountMinor = decimalToMinor(customAmount);
    if (amountMinor === null) return;
    prepare(amountMinor);
  }

  if (props.ended) return <Card className="p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("title")}</h2><p className="mt-2 text-muted-foreground">{t("ended")}</p></Card>;
  if (!props.signedIn) return <Card className="p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("title")}</h2><p className="mt-2 text-muted-foreground">{t("signInDescription")}</p><a href={`/${props.locale}/sign-in?redirect_url=${encodeURIComponent(`/${props.locale}/auctions/${props.auctionId}`)}`} className="mt-5 inline-flex min-h-11 items-center rounded-soft bg-primary px-5 py-2.5 font-semibold text-white">{t("signIn")}</a></Card>;

  const quickAmounts = props.bidCount === 0
    ? [props.minimumNextBidMinor]
    : [1, 2, 3].map((multiple) => (props.currentHighestMinor ?? 0) + props.minimumIncrementMinor * multiple);
  const visibleConfirmation = state.status === "accepted" || state.status === "replayed" ? null : confirmation;

  return <Card className="p-5 sm:p-6">
    <h2 className="text-xl font-semibold">{t("title")}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{t("minimum", { amount: money.format(props.minimumNextBidMinor / 100) })}</p>
    <div className="mt-5 flex flex-wrap gap-3">{quickAmounts.map((amount, index) => <Button key={amount} variant={index === 0 ? "primary" : "secondary"} onClick={() => prepare(amount)}>{props.bidCount === 0 ? t("offer", { amount: money.format(amount / 100) }) : t("increment", { increment: money.format(props.minimumIncrementMinor * (index + 1) / 100), total: money.format(amount / 100) })}</Button>)}</div>
    <form onSubmit={prepareCustom} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><Input id="custom-bid" type="number" min="0.01" step="0.01" required label={t("customLabel")} value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} /><Button type="submit">{t("review")}</Button></form>
    {visibleConfirmation ? <form action={formAction} className="mt-6 rounded-soft border border-primary bg-primary/5 p-4"><p className="font-semibold">{t("confirmTitle")}</p><p className="mt-2 text-2xl font-bold text-primary">{money.format(visibleConfirmation.amountMinor / 100)}</p><p className="mt-2 text-sm text-muted-foreground">{t("confirmDescription")}</p>{visibleConfirmation.minimumAtReviewMinor !== props.minimumNextBidMinor ? <p role="alert" className="mt-3 rounded-soft bg-tertiary/15 p-3 text-sm font-semibold text-foreground">{t("minimumChanged", { minimum: money.format(props.minimumNextBidMinor / 100) })}</p> : null}<input type="hidden" name="amountMinor" value={visibleConfirmation.amountMinor} /><input type="hidden" name="requestId" value={visibleConfirmation.requestId} /><div className="mt-4 flex flex-wrap gap-3"><Button type="submit" isLoading={pending}><Gavel className="size-4" aria-hidden="true" />{t("confirm")}</Button><Button type="button" variant="secondary" disabled={pending} onClick={() => setConfirmation(null)}>{t("cancel")}</Button></div></form> : null}
    {state.status ? <p role={state.status === "accepted" || state.status === "replayed" ? "status" : "alert"} className="mt-4 rounded-soft bg-surface-muted p-3 text-sm font-semibold">{t(`status.${state.status}`, { minimum: money.format((state.minimumNextBidMinor ?? props.minimumNextBidMinor) / 100) })}</p> : null}
  </Card>;
}
