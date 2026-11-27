import { auth } from "@clerk/nextjs/server";
import { CheckCircle2, ExternalLink, Mail, MapPin, QrCode, RotateCcw, Trash2, UserRound } from "lucide-react";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { addAuctionNoteAction, addAuctionPhotosAction, cancelAuctionAction, completeAuctionSaleAction, continueWithNextAuctionCandidateAction, deleteAuctionAction, removeAuctionPhotoAction, updateAuctionAction } from "@/app/[locale]/my-auctions/[id]/actions";
import { AuctionDetail } from "@/components/auctions/auction-detail";
import { CancelAuctionDialog } from "@/components/auctions/cancel-auction-dialog";
import { getAuctionStatus } from "@/lib/auction-cancellation";
import { ManagementPhotoUpload } from "@/components/auctions/management-photo-upload";
import { RealAuctionGallery } from "@/components/auctions/real-auction-gallery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getOwnedAuctionFinalization } from "@/lib/supabase/auction-results";
import { getCurrentUserAuction } from "@/lib/supabase/auctions";
import { getAuctionPhotoUrl, MAX_AUCTION_PHOTOS } from "@/lib/supabase/auction-photos";
import { currentTimestamp } from "@/lib/server-time";

export const instant = false;

function localDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export default async function ManageAuctionPage({ params, searchParams }: PageProps<"/[locale]/my-auctions/[id]">) {
  const { locale, id } = await params;
  const { status } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  await auth.protect({ unauthenticatedUrl: `/${locale}/sign-in?redirect_url=${encodeURIComponent(`/${locale}/my-auctions/${id}`)}` });
  if (id.startsWith("demo-")) return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8"><AuctionDetail id={id} management /></main>;
  const auction = await getCurrentUserAuction(id, locale);
  if (!auction) notFound();

  const t = await getTranslations("MyAuctions.live.management");
  const cancellationT = await getTranslations("AuctionCancellation");
  const auctionStatus = getAuctionStatus(auction, currentTimestamp());
  const active = auctionStatus === "active";
  const finalization = auctionStatus === "ended" ? await getOwnedAuctionFinalization(id, locale) : null;
  const canEdit = active && auction.bidCount === 0;
  const canAddNote = active && auction.bidCount > 0;
  const photoUrls = auction.photoPaths.map(getAuctionPhotoUrl);
  const allowedStatuses = ["continued", "invalid", "noteAdded", "photoCleanupFailed", "photoInvalid", "photosSaved", "saleCompleted", "saved", "unavailable"];
  const visibleStatus = typeof status === "string" && allowedStatuses.includes(status) ? status : null;

  return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/my-auctions" className="font-semibold text-primary">{t("back")}</Link><div className="flex flex-wrap gap-3"><Link href={`/my-auctions/${id}/share`} className="inline-flex min-h-11 items-center gap-2 rounded-soft border border-primary px-4 py-2 font-semibold text-primary"><QrCode className="size-4" aria-hidden="true" />{t("shareAuction")}</Link><Link href={`/auctions/${id}`} className="inline-flex min-h-11 items-center gap-2 rounded-soft border border-primary px-4 py-2 font-semibold text-primary"><ExternalLink className="size-4" aria-hidden="true" />{t("visitorPreview")}</Link></div></div>
    <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]"><RealAuctionGallery photoUrls={photoUrls} title={auction.title} /><Card className="p-5 sm:p-6"><p className="text-sm font-semibold text-tertiary">{t("eyebrow")}</p><h1 className="mt-2 text-3xl font-semibold">{auction.title}</h1><p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>{auction.location ?? t("locationUnavailable")}</span></p><p className="mt-3 text-muted-foreground">{canEdit ? t("editable") : canAddNote ? t("noteOnly") : auctionStatus === "ended" ? t("readOnly") : null}</p>{visibleStatus ? <p role="status" className="mt-4 rounded-soft bg-primary/10 p-3 text-sm font-semibold text-primary">{t(`status.${visibleStatus}`)}</p> : null}</Card></div>

    {active && auction.supportsCancellation ? <Card className="mt-6 p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{cancellationT("section")}</h2>
      <CancelAuctionDialog action={cancelAuctionAction.bind(null, id)} />
    </Card> : null}
    {auctionStatus === "cancelled" ? <Card className="mt-6 p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{cancellationT("cancelled")}</h2>
      <p className="mt-3 whitespace-pre-wrap wrap-anywhere text-muted-foreground">{auction.cancellationReason}</p>
      <p className="mt-3 text-sm text-muted-foreground">{cancellationT("bidCount", { count: auction.bidCount })}</p>
    </Card> : null}

    {auctionStatus === "ended" ? <Card className="mt-6 p-5 sm:p-6">
      <p className="text-sm font-semibold text-tertiary">{t("finalization.eyebrow")}</p>
      <h2 className="mt-1 text-2xl font-semibold">{t("finalization.title")}</h2>
      <p className="mt-3 text-muted-foreground">{finalization ? t(`finalization.state.${finalization.status}`) : t("finalization.processing")}</p>
      {finalization?.confirmedBidderContact ? <div className="mt-5 rounded-soft border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-primary">{t("finalization.bidderContact")}</p>
        <p className="mt-3 flex items-center gap-2 text-sm"><UserRound aria-hidden="true" className="size-4 text-tertiary" />{finalization.confirmedBidderContact.displayName}</p>
        <a href={`mailto:${finalization.confirmedBidderContact.emailAddress}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"><Mail aria-hidden="true" className="size-4" />{finalization.confirmedBidderContact.emailAddress}</a>
      </div> : null}
      {finalization?.status === "interest_confirmed" ? <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <form action={completeAuctionSaleAction.bind(null, locale, id)} className="rounded-soft border border-border p-4">
          <h3 className="font-semibold">{t("finalization.completeTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("finalization.completeHelp")}</p>
          <Button type="submit" className="mt-4"><CheckCircle2 aria-hidden="true" className="size-4" />{t("finalization.complete")}</Button>
        </form>
        <form action={continueWithNextAuctionCandidateAction.bind(null, locale, id)} className="rounded-soft border border-border p-4">
          <h3 className="font-semibold">{t("finalization.continueTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("finalization.continueHelp")}</p>
          <Button type="submit" variant="secondary" className="mt-4"><RotateCcw aria-hidden="true" className="size-4" />{t("finalization.continue")}</Button>
        </form>
      </div> : null}
    </Card> : null}

    {canEdit ? <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card className="p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("editTitle")}</h2><form action={updateAuctionAction.bind(null, locale, id)} className="mt-5 grid gap-5"><Input id="manage-title" name="title" required minLength={3} maxLength={120} label={t("fields.title")} defaultValue={auction.title} /><Input id="manage-location" name="location" required minLength={2} maxLength={120} label={t("fields.location")} defaultValue={auction.location ?? ""} helpText={t("fields.locationHelp")} /><Textarea id="manage-description" name="description" maxLength={5000} label={t("fields.description")} defaultValue={auction.description} /><div className="grid gap-5 sm:grid-cols-2"><Input id="manage-start" name="startingPrice" type="number" min="0.01" step="0.01" required label={t("fields.starting")} defaultValue={(auction.startingPriceMinor / 100).toFixed(2)} /><Input id="manage-increment" name="minimumIncrement" type="number" min="0.01" step="0.01" required label={t("fields.increment")} defaultValue={(auction.minimumIncrementMinor / 100).toFixed(2)} /></div><Input id="manage-end" name="endsAt" type="datetime-local" required label={t("fields.endAt")} defaultValue={localDateTime(auction.endsAt)} /><Button type="submit">{t("save")}</Button></form></Card>
      <div className="grid content-start gap-6"><Card className="p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("photosTitle")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("photosHelp", { count: MAX_AUCTION_PHOTOS })}</p>{auction.photoPaths.length < MAX_AUCTION_PHOTOS ? <ManagementPhotoUpload action={addAuctionPhotosAction.bind(null, locale, id)} /> : null}{auction.photoPaths.length ? <ul className="mt-5 grid gap-2">{auction.photoPaths.map((path, index) => <li key={path} className="flex items-center justify-between rounded-soft border border-border p-3"><span>{t("photo", { number: index + 1 })}</span><form action={removeAuctionPhotoAction.bind(null, locale, id)}><input type="hidden" name="path" value={path} /><Button type="submit" variant="secondary" className="px-3" aria-label={t("removePhoto", { number: index + 1 })}><Trash2 className="size-4" aria-hidden="true" /></Button></form></li>)}</ul> : null}</Card>
        <Card className="border-error/40 p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("deleteTitle")}</h2><p className="mt-2 text-sm text-muted-foreground">{t("deleteConsequence")}</p><form action={deleteAuctionAction.bind(null, locale, id)} className="mt-5 grid gap-4"><label className="flex items-start gap-3"><input name="confirmation" value="delete" type="checkbox" required className="mt-1 size-4" /><span>{t("deleteConfirmation")}</span></label><Button type="submit" className="w-fit"><Trash2 className="size-4" aria-hidden="true" />{t("confirmDelete")}</Button></form></Card></div>
    </div> : canAddNote ? <Card className="mt-6 p-6"><h2 className="text-xl font-semibold">{t("noteTitle")}</h2><p className="mt-2 text-muted-foreground">{t("noteOnly")}</p><form action={addAuctionNoteAction.bind(null, locale, id)} className="mt-5 grid gap-4"><Textarea id="owner-note" name="body" required maxLength={2000} label={t("noteLabel")} /><Button type="submit" className="w-fit">{t("publishNote")}</Button></form></Card> : null}
  </main>;
}
