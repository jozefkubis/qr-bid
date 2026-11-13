import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { RealAuctionGallery } from "@/components/auctions/real-auction-gallery";
import { LiveBiddingPanel } from "@/components/auctions/live-bidding-panel";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { PublicAuction } from "@/lib/supabase/auctions";
import { getAuctionPhotoUrl } from "@/lib/supabase/auction-photos";
import { currentTimestamp } from "@/lib/server-time";
import type { BidActionState } from "@/lib/bid-action-state";

export async function RealAuctionDetail({ auction, bidAction, locale, signedIn }: { auction: PublicAuction; bidAction: (state: BidActionState, formData: FormData) => Promise<BidActionState>; locale: string; signedIn: boolean }) {
  const t = await getTranslations("AuctionDetail");
  const biddingT = await getTranslations("LiveBidding");
  const language = locale === "sk" ? "sk-SK" : "en-IE";
  const money = new Intl.NumberFormat(language, { style: "currency", currency: auction.currency });
  const dateTime = new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" });
  const ended = new Date(auction.endsAt).getTime() <= currentTimestamp();
  const photoUrls = auction.photoPaths.map(getAuctionPhotoUrl);

  return <div className="grid gap-6">
    <Link href="/" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-soft text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowLeft className="size-4" aria-hidden="true" />{t("backHome")}</Link>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <RealAuctionGallery photoUrls={photoUrls} title={auction.title} />
      <Card className="p-5 sm:p-6">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ended ? "bg-surface-muted text-muted-foreground" : "bg-primary text-white"}`}>{ended ? t("status.ended") : t("status.active")}</span>
        <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">{auction.title}</h1>
        <p className="mt-5 font-semibold text-primary">{ended ? t("endedOn", { date: dateTime.format(new Date(auction.endsAt)) }) : t("liveEndsOn", { date: dateTime.format(new Date(auction.endsAt)) })}</p>
        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
          <div className="col-span-2"><dt className="text-sm text-muted-foreground">{t("price.current")}</dt><dd className="mt-1 text-3xl font-bold text-primary">{auction.currentHighestMinor === null ? t("price.noBids") : money.format(auction.currentHighestMinor / 100)}</dd></div>
          <div><dt className="text-sm text-muted-foreground">{t("price.starting")}</dt><dd className="mt-1 font-semibold">{money.format(auction.startingPriceMinor / 100)}</dd></div>
          <div><dt className="text-sm text-muted-foreground">{t("price.increment")}</dt><dd className="mt-1 font-semibold">{money.format(auction.minimumIncrementMinor / 100)}</dd></div>
        </dl>
      </Card>
    </div>
    <Card className="p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("description")}</h2><p className="mt-3 whitespace-pre-wrap text-muted-foreground">{auction.description || t("noDescription")}</p></Card>
    {auction.ownerNotes.length ? <Card className="p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("notes.title")}</h2><ol className="mt-4 grid gap-4">{auction.ownerNotes.map((note) => <li key={`${note.createdAt}-${note.body}`} className="border-l-2 border-tertiary pl-4"><p>{note.body}</p><time className="mt-1 block text-xs text-muted-foreground">{dateTime.format(new Date(note.createdAt))}</time></li>)}</ol></Card> : null}
    <LiveBiddingPanel action={bidAction} auctionId={auction.id} bidCount={auction.bidCount} currentHighestMinor={auction.currentHighestMinor} ended={ended} locale={locale} minimumIncrementMinor={auction.minimumIncrementMinor} minimumNextBidMinor={auction.minimumNextBidMinor} signedIn={signedIn} />
    <Card className="p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{t("history.title")}</h2><span className="text-sm text-muted-foreground">{biddingT("bidCount", { count: auction.bidCount })}</span></div>{auction.bidHistory.length ? <ol className="mt-4 divide-y divide-border">{auction.bidHistory.map((bid, index) => <li key={`${bid.createdAt}-${bid.amountMinor}`} className="flex items-center justify-between gap-4 py-3"><div><p className="font-semibold">{money.format(bid.amountMinor / 100)}</p>{index === 0 ? <span className="text-xs font-semibold text-primary">{t("history.highest")}</span> : null}</div><time className="text-sm text-muted-foreground">{dateTime.format(new Date(bid.createdAt))}</time></li>)}</ol> : <p className="mt-3 text-muted-foreground">{t("history.empty")}</p>}</Card>
  </div>;
}
