import "server-only";

export type AuctionResultEmailJob = {
  amountMinor: number | null;
  auctionId: string;
  auctionTitle: string;
  currency: string;
  expiresAt: string | null;
  locale: "en" | "sk";
  notificationType: string;
  recipientIsOwner: boolean;
};

type AuctionResultEmail = {
  html: string;
  subject: string;
  text: string;
};

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function formatAmount(amountMinor: number | null, locale: "en" | "sk", currency: string) {
  if (amountMinor === null) return null;
  return new Intl.NumberFormat(locale === "sk" ? "sk-SK" : "en-IE", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

function formatDeadline(expiresAt: string | null, locale: "en" | "sk") {
  if (!expiresAt) return null;
  return new Intl.DateTimeFormat(locale === "sk" ? "sk-SK" : "en-IE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(expiresAt));
}

export function buildAuctionResultEmail(job: AuctionResultEmailJob, appUrl: string): AuctionResultEmail {
  const slovak = job.locale === "sk";
  const ownerPath = `/${job.locale}/my-auctions/${job.auctionId}`;
  const bidderPath = `/${job.locale}/my-bids`;
  const targetPath = job.recipientIsOwner ? ownerPath : bidderPath;
  const link = new URL(targetPath, appUrl).toString();
  const amount = formatAmount(job.amountMinor, job.locale, job.currency);
  const deadline = formatDeadline(job.expiresAt, job.locale);

  let subject: string;
  let heading: string;
  let paragraphs: string[];
  let action: string;

  switch (job.notificationType) {
    case "offer_issued":
      subject = slovak ? `Odpovedz na výsledok aukcie: ${job.auctionTitle}` : `Respond to the auction result: ${job.auctionTitle}`;
      heading = slovak ? "Máš novú výsledkovú ponuku" : "You have a new result offer";
      paragraphs = slovak
        ? [`Tvoja ponúknutá suma je ${amount}.`, `Odpovedz najneskôr ${deadline}. Neúspešné doručenie e-mailu tento termín nemení.`]
        : [`Your offered amount is ${amount}.`, `Respond by ${deadline}. Email delivery failures do not move this deadline.`];
      action = slovak ? "Otvoriť Moje ponuky" : "Open My Bids";
      break;
    case "interest_confirmed":
      subject = slovak ? `Záujem potvrdený: ${job.auctionTitle}` : `Interest confirmed: ${job.auctionTitle}`;
      heading = slovak ? "Záujem bol potvrdený" : "Interest was confirmed";
      paragraphs = slovak
        ? [job.recipientIsOwner ? "Záujemca potvrdil, že chce pokračovať." : "Tvoje potvrdenie bolo prijaté.", "V chránenej časti QRBid nájdeš meno a overený e-mail druhej strany. Potvrdenie nie je platba ani automatické dokončenie predaja."]
        : [job.recipientIsOwner ? "The bidder confirmed that they want to continue." : "Your confirmation was received.", "The protected QRBid area shows the other party's name and verified email. Confirmation is not payment or automatic sale completion."];
      action = job.recipientIsOwner
        ? (slovak ? "Otvoriť správu aukcie" : "Open auction management")
        : (slovak ? "Otvoriť Moje ponuky" : "Open My Bids");
      break;
    case "no_bids":
      subject = slovak ? `Aukcia skončila bez ponúk: ${job.auctionTitle}` : `Auction ended without bids: ${job.auctionTitle}`;
      heading = slovak ? "Aukcia skončila bez ponúk" : "The auction ended without bids";
      paragraphs = slovak ? ["Do termínu aukcie nebola prijatá žiadna platná ponuka."] : ["No valid bid was accepted before the auction deadline."];
      action = slovak ? "Otvoriť správu aukcie" : "Open auction management";
      break;
    case "ranking_exhausted":
      subject = slovak ? `Poradie záujemcov sa vyčerpalo: ${job.auctionTitle}` : `The bidder ranking was exhausted: ${job.auctionTitle}`;
      heading = slovak ? "Poradie záujemcov sa vyčerpalo" : "The bidder ranking was exhausted";
      paragraphs = slovak ? ["Všetci oprávnení záujemcovia odmietli alebo im uplynul termín. Pre ďalší pokus vytvor novú aukciu."] : ["Every eligible bidder declined or expired. Create a new auction for another attempt."];
      action = slovak ? "Otvoriť správu aukcie" : "Open auction management";
      break;
    case "sale_completed":
      subject = slovak ? `Predaj bol dokončený: ${job.auctionTitle}` : `Sale completed: ${job.auctionTitle}`;
      heading = slovak ? "Predaj bol zaevidovaný ako dokončený" : "The sale was recorded as completed";
      paragraphs = slovak ? ["Vlastník označil priamu dohodu ako dokončenú v QRBid."] : ["The owner marked the direct agreement as completed in QRBid."];
      action = job.recipientIsOwner
        ? (slovak ? "Otvoriť správu aukcie" : "Open auction management")
        : (slovak ? "Otvoriť Moje ponuky" : "Open My Bids");
      break;
    default:
      throw new Error("Unsupported notification type.");
  }

  const text = `${heading}\n\n${paragraphs.join("\n\n")}\n\n${action}: ${link}`;
  const html = `<!doctype html><html lang="${job.locale}"><body style="margin:0;background:#faf6f0;color:#2e322f;font-family:Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:32px 20px"><div style="background:#fff;border:1px solid #e6ddd1;border-radius:12px;padding:28px"><p style="margin:0 0 8px;color:#4a7c59;font-weight:700">QRBid</p><h1 style="margin:0 0 20px;font-size:24px">${escapeHtml(heading)}</h1><h2 style="margin:0 0 16px;font-size:18px">${escapeHtml(job.auctionTitle)}</h2>${paragraphs.map((paragraph) => `<p style="margin:0 0 14px;line-height:1.6">${escapeHtml(paragraph)}</p>`).join("")}<p style="margin:24px 0 0"><a href="${escapeHtml(link)}" style="display:inline-block;border-radius:10px;background:#4a7c59;color:#fff;padding:12px 18px;text-decoration:none;font-weight:700">${escapeHtml(action)}</a></p></div></div></body></html>`;
  return { html, subject, text };
}
