"use client";

import { QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { AuctionDuration } from "@/components/auctions/auction-duration";
import { PhotoPicker } from "@/components/auctions/photo-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { initialCreateAuctionState, type CreateAuctionState } from "@/lib/auction-form-state";

type CreateAuctionFormProps = {
  action: (state: CreateAuctionState, formData: FormData) => Promise<CreateAuctionState>;
};

export function CreateAuctionForm({ action }: CreateAuctionFormProps) {
  const t = useTranslations("AuctionForm");
  const [state, formAction, pending] = useActionState(action, initialCreateAuctionState);

  const errorText = (field: keyof NonNullable<CreateAuctionState["fieldErrors"]>) => {
    const code = state.fieldErrors?.[field];
    return code ? t(`active.errors.${code}`) : undefined;
  };

  return (
    <Card className="p-5 sm:p-10">
      <form action={formAction} aria-label={t("active.formLabel")} className="grid min-w-0 gap-8">
        {state.formError ? <p role="alert" className="rounded-soft border border-error bg-error/5 p-4 text-sm font-semibold text-error">{t(`active.errors.${state.formError}`)}</p> : null}
        <fieldset className="grid min-w-0 gap-7">
          <legend className="sr-only">{t("details")}</legend>
          <Input id="auction-title" name="title" label={t("titleLabel")} required minLength={3} maxLength={120} placeholder={t("titlePlaceholder")} defaultValue={t("titleExample")} helpText={t("titleHelp")} error={errorText("title")} />
          <Textarea id="auction-description" name="description" label={t("descriptionLabel")} rows={5} maxLength={5000} defaultValue={t("descriptionExample")} helpText={t("descriptionHelp")} error={errorText("description")} />
          <PhotoPicker />
          {errorText("photos") ? <p className="text-sm font-semibold text-error">{errorText("photos")}</p> : null}
        </fieldset>
        <fieldset className="min-w-0 border-t border-border pt-8">
          <legend className="sr-only">{t("pricingRules")}</legend>
          <h2 className="mb-5 text-xl font-semibold">{t("pricingRules")}</h2>
          <div className="grid items-start gap-5 sm:grid-cols-2">
            <Input id="starting-price" name="startingPrice" type="number" label={t("startingPrice")} required min="0.01" defaultValue="80" step="0.01" helpText={t("startingPriceHelp")} error={errorText("startingPrice")} />
            <Input id="minimum-increment" name="minimumIncrement" type="number" label={t("minimumIncrement")} required min="0.01" defaultValue="5" step="0.01" helpText={t("minimumIncrementHelp")} error={errorText("minimumIncrement")} />
          </div>
        </fieldset>
        <AuctionDuration error={errorText("endsAt")} />
        <div className="grid gap-5 border-t border-border pt-6 sm:flex sm:items-start sm:justify-between">
          <div className="grid gap-2 sm:max-w-40"><Button variant="secondary" disabled aria-describedby="draft-help">{t("saveDraft")}</Button><p id="draft-help" className="text-sm text-muted-foreground">{t("draftUnavailable")}</p></div>
          <div className="grid gap-2 sm:max-w-sm"><Button type="submit" isLoading={pending} aria-describedby="creation-help"><QrCode aria-hidden="true" className="size-5 shrink-0" /><span>{t("active.createAuction")}</span></Button><p id="creation-help" className="text-sm text-muted-foreground sm:text-right">{t("active.creationHelp")}</p></div>
        </div>
      </form>
    </Card>
  );
}
