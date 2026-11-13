"use client";

import { ArrowLeft, Clipboard, ExternalLink, MapPin, QrCode, Trash2, Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { AuctionGallery } from "@/components/auctions/auction-gallery";
import { BidHistory } from "@/components/auctions/bid-history";
import { useDemoAuctions } from "@/components/auctions/demo-auctions-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAuctionBidSummary, getEffectiveAuctionStatus } from "@/data/demo-auctions";
import { Link, useRouter } from "@/i18n/navigation";

type AuctionDetailProps = { id: string; management?: boolean };

function countdown(endAt: string, now: number) {
  const minutes = Math.max(0, Math.ceil((new Date(endAt).getTime() - now) / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const rest = minutes % 60;
  return { days, hours, minutes: rest };
}

function toLocalDateTime(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AuctionDetail({ id, management = false }: AuctionDetailProps) {
  const t = useTranslations("AuctionDetail");
  const locale = useLocale();
  const router = useRouter();
  const { auctions, now, updateAuction, addNote, addPhotos, removePhoto, deleteAuction } = useDemoAuctions();
  const auction = auctions.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const origin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => "");

  if (now === null) return <div aria-hidden="true" className="h-96 animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none" />;
  if (!auction) return (
    <Card className="mx-auto max-w-2xl p-8 text-center">
      <h1 className="text-2xl font-semibold">{t("notFound.title")}</h1>
      <p className="mt-3 text-muted-foreground">{t("notFound.description")}</p>
      <Link href={management ? "/my-auctions" : "/"} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-soft bg-primary px-5 py-2.5 font-semibold text-white"><ArrowLeft className="size-4" aria-hidden="true" />{management ? t("backToAuctions") : t("backHome")}</Link>
    </Card>
  );

  const language = locale === "sk" ? "sk-SK" : "en-IE";
  const money = new Intl.NumberFormat(language, { style: "currency", currency: auction.currency, minimumFractionDigits: 2 });
  const dateTime = new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" });
  const status = getEffectiveAuctionStatus(auction, now);
  const { bidCount, highestBidMinor } = getAuctionBidSummary(auction);
  const remaining = countdown(auction.endAt, now);
  const canEdit = management && status === "active" && bidCount === 0;
  const canAddNote = management && status === "active" && bidCount > 0;
  const visitorPath = `/auctions/${auction.id}`;
  const shareUrl = origin ? new URL(`/${locale}${visitorPath}`, origin).toString() : `/${locale}${visitorPath}`;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (now === null) return;
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const description = String(data.get("description") ?? "").trim();
    const location = String(data.get("location") ?? "").trim();
    const starting = Number(data.get("startingPrice"));
    const increment = Number(data.get("minimumIncrement"));
    const end = new Date(String(data.get("endAt"))).getTime();
    if (!title || !description || !location || !Number.isFinite(starting) || starting <= 0 || !Number.isFinite(increment) || increment <= 0 || !Number.isFinite(end) || end <= now) {
      setFeedback(t("management.validation"));
      return;
    }
    const saved = updateAuction(id, { title, description, location, startingPriceMinor: Math.round(starting * 100), minimumIncrementMinor: Math.round(increment * 100), endAt: new Date(end).toISOString() });
    setFeedback(saved ? t("management.saved") : t("management.changedState"));
    if (saved) setEditing(false);
  }

  async function copyLink() {
    const url = new URL(`/${locale}${visitorPath}`, window.location.origin).toString();
    try { await navigator.clipboard.writeText(url); setFeedback(t("sharing.copied")); }
    catch { setFeedback(t("sharing.manual")); }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={management ? "/my-auctions" : "/"} className="inline-flex min-h-11 items-center gap-2 rounded-soft text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowLeft className="size-4" aria-hidden="true" />{management ? t("backToAuctions") : t("backHome")}</Link>
        {management ? <Link href={visitorPath} className="inline-flex min-h-11 items-center gap-2 rounded-soft border border-primary px-4 py-2 text-sm font-semibold text-primary"><ExternalLink className="size-4" aria-hidden="true" />{t("visitorPreview")}</Link> : null}
      </div>

      <p className="w-fit rounded-full bg-tertiary/10 px-3 py-1 text-xs font-semibold text-tertiary">{t("demoDisclosure")}</p>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <AuctionGallery auction={auction} />
        <Card className="p-5 sm:p-6">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === "active" ? "bg-primary text-white" : "bg-surface-muted text-muted-foreground"}`}>{status === "active" ? t("status.active") : t("status.ended")}</span>
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">{auction.title}</h1>
          <p className="mt-3 flex gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{auction.location}</p>
          <p className="mt-5 font-semibold text-primary">{status === "active" ? t("remaining", remaining) : t("endedOn", { date: dateTime.format(new Date(auction.endAt)) })}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5">
            <div className="col-span-2"><dt className="text-sm text-muted-foreground">{t("price.current")}</dt><dd className="mt-1 text-3xl font-bold text-primary">{highestBidMinor === undefined ? t("price.noBids") : money.format(highestBidMinor / 100)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">{t("price.starting")}</dt><dd className="mt-1 font-semibold">{money.format(auction.startingPriceMinor / 100)}</dd></div>
            <div><dt className="text-sm text-muted-foreground">{t("price.increment")}</dt><dd className="mt-1 font-semibold">{money.format(auction.minimumIncrementMinor / 100)}</dd></div>
          </dl>
        </Card>
      </div>

      <Card className="p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("description")}</h2><p className="mt-3 whitespace-pre-wrap text-muted-foreground">{auction.description}</p></Card>
      {auction.notes.length ? <Card className="p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("notes.title")}</h2><ol className="mt-4 grid gap-4">{auction.notes.map((item) => <li key={item.id} className="border-l-2 border-tertiary pl-4"><p>{item.text}</p><time className="mt-1 block text-xs text-muted-foreground">{dateTime.format(new Date(item.publishedAt))}</time></li>)}</ol></Card> : null}
      <BidHistory auction={auction} />

      {management ? (
        <Card className="p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{t("management.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{canEdit ? t("management.editable") : canAddNote ? t("management.noteOnly") : t("management.readOnly")}</p>
          {canEdit && !editing ? <div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => setEditing(true)}>{t("management.edit")}</Button><Button variant="secondary" onClick={() => setDeleteOpen(true)}><Trash2 className="size-4" aria-hidden="true" />{t("management.delete")}</Button></div> : null}
          {canEdit && editing ? (
            <form onSubmit={save} className="mt-6 grid gap-5">
              <Input id="manage-title" name="title" required label={t("management.fields.title")} defaultValue={auction.title} />
              <Textarea id="manage-description" name="description" required label={t("management.fields.description")} defaultValue={auction.description} />
              <Input id="manage-location" name="location" required label={t("management.fields.location")} defaultValue={auction.location} />
              <div className="grid gap-5 sm:grid-cols-2"><Input id="manage-start" name="startingPrice" type="number" min="0.01" step="0.01" required label={t("management.fields.starting")} defaultValue={(auction.startingPriceMinor / 100).toFixed(2)} /><Input id="manage-increment" name="minimumIncrement" type="number" min="0.01" step="0.01" required label={t("management.fields.increment")} defaultValue={(auction.minimumIncrementMinor / 100).toFixed(2)} /></div>
              <Input id="manage-end" name="endAt" type="datetime-local" required label={t("management.fields.endAt")} defaultValue={toLocalDateTime(auction.endAt)} />
              <div><label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-soft border border-primary px-4 py-2 font-semibold text-primary"><Upload className="size-4" aria-hidden="true" />{t("management.addPhotos")}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => addPhotos(auction.id, Array.from(event.target.files ?? []))} /></label></div>
              {auction.photoUrls.length ? <ul className="grid gap-2 sm:grid-cols-2">{auction.photoUrls.map((url, index) => <li key={url} className="flex items-center justify-between rounded-soft border border-border p-3 text-sm"><span>{t("management.photo", { number: index + 1 })}</span><Button variant="secondary" className="px-3" aria-label={t("management.removePhoto", { number: index + 1 })} onClick={() => removePhoto(auction.id, url)}><Trash2 className="size-4" aria-hidden="true" /></Button></li>)}</ul> : null}
              <div className="flex flex-wrap gap-3"><Button type="submit">{t("management.save")}</Button><Button variant="secondary" onClick={() => { setEditing(false); setFeedback(""); }}>{t("management.cancel")}</Button></div>
            </form>
          ) : null}
          {canAddNote ? <form className="mt-6 grid gap-4" onSubmit={(event) => { event.preventDefault(); const saved = addNote(auction.id, note); setFeedback(saved ? t("management.noteAdded") : t("management.changedState")); if (saved) setNote(""); }}><Textarea id="owner-note" label={t("management.noteLabel")} value={note} onChange={(event) => setNote(event.target.value)} required /><Button type="submit" className="w-fit">{t("management.publishNote")}</Button></form> : null}
        </Card>
      ) : null}

      {management ? <Card className="p-5 sm:p-6"><h2 className="text-xl font-semibold">{t("sharing.title")}</h2><div className="mt-5 grid gap-5 md:grid-cols-[10rem_1fr]"><div className="flex aspect-square items-center justify-center rounded-soft border border-dashed border-primary bg-surface-muted text-center"><div><QrCode className="mx-auto size-10 text-primary" aria-hidden="true" /><p className="mt-2 px-2 text-xs font-semibold">{t("sharing.qrUnavailable")}</p></div></div><div><label htmlFor="share-url" className="font-semibold">{t("sharing.link")}</label><input id="share-url" readOnly value={shareUrl} className="mt-2 min-h-11 w-full rounded-soft border border-border bg-surface px-3" onFocus={(event) => event.currentTarget.select()} /><Button className="mt-3" onClick={copyLink}><Clipboard className="size-4" aria-hidden="true" />{t("sharing.copy")}</Button><p className="mt-3 text-sm text-muted-foreground">{t("sharing.localOnly")}</p></div></div></Card> : null}
      {feedback ? <p role="status" className="rounded-soft bg-primary/10 p-3 font-semibold text-primary">{feedback}</p> : null}

      {deleteOpen ? <div role="dialog" aria-modal="true" aria-labelledby="delete-title" onKeyDown={(event) => { if (event.key === "Escape") setDeleteOpen(false); }} className="fixed inset-0 z-60 flex items-center justify-center bg-foreground/45 p-4"><Card className="w-full max-w-lg p-6"><h2 id="delete-title" className="text-xl font-semibold">{t("management.deleteTitle", { title: auction.title })}</h2><p className="mt-3 text-muted-foreground">{t("management.deleteConsequence")}</p><div className="mt-6 flex flex-wrap justify-end gap-3"><Button autoFocus variant="secondary" onClick={() => setDeleteOpen(false)}>{t("management.cancel")}</Button><Button onClick={() => { if (deleteAuction(auction.id)) router.push("/my-auctions"); else { setDeleteOpen(false); setFeedback(t("management.changedState")); } }}>{t("management.confirmDelete")}</Button></div></Card></div> : null}
    </div>
  );
}
