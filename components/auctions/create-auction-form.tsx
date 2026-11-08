"use client";

import { QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuctionDuration } from "@/components/auctions/auction-duration";
import { PhotoPicker } from "@/components/auctions/photo-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateAuctionForm() {
  const t = useTranslations("AuctionForm");

  return (
    <Card className="p-5 sm:p-10">
      <form aria-label={t("formLabel")} aria-describedby="auction-preview" onSubmit={(event) => event.preventDefault()} className="grid min-w-0 gap-8">
        <fieldset className="grid min-w-0 gap-7">
          <legend className="sr-only">{t("details")}</legend>
          <Input id="auction-title" name="title" label={t("titleLabel")} required placeholder={t("titlePlaceholder")} defaultValue={t("titleExample")} helpText={t("titleHelp")} />
          <Textarea id="auction-description" name="description" label={t("descriptionLabel")} rows={5} defaultValue={t("descriptionExample")} helpText={t("descriptionHelp")} />
          <PhotoPicker />
        </fieldset>
        <fieldset className="min-w-0 border-t border-border pt-8">
          <legend className="sr-only">{t("pricingRules")}</legend>
          <h2 className="mb-5 text-xl font-semibold">{t("pricingRules")}</h2>
          <div className="grid items-start gap-5 sm:grid-cols-2">
            <Input id="starting-price" name="startingPrice" type="number" label={t("startingPrice")} required defaultValue="80" step="0.01" helpText={t("startingPriceHelp")} />
            <Input id="minimum-increment" name="minimumIncrement" type="number" label={t("minimumIncrement")} required defaultValue="5" step="0.01" helpText={t("minimumIncrementHelp")} />
          </div>
        </fieldset>
        <AuctionDuration />
        <div className="grid gap-5 border-t border-border pt-6 sm:flex sm:items-start sm:justify-between">
          <div className="grid gap-2 sm:max-w-40"><Button variant="secondary" disabled aria-describedby="draft-help">{t("saveDraft")}</Button><p id="draft-help" className="text-sm text-muted-foreground">{t("draftUnavailable")}</p></div>
          <div className="grid gap-2 sm:max-w-sm"><Button disabled aria-describedby="creation-help"><QrCode aria-hidden="true" className="size-5 shrink-0" /><span>{t("createAndGenerate")}</span></Button><p id="creation-help" className="text-sm text-muted-foreground sm:text-right">{t("creationUnavailable")}</p></div>
        </div>
      </form>
    </Card>
  );
}
