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

export type AuctionResultEmail = {
  html: string;
  subject: string;
  text: string;
};

type EmailContent = {
  action: string;
  heading: string;
  paragraphs: string[];
  subject: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function formatAmount(
  amountMinor: number | null,
  locale: "en" | "sk",
  currency: string,
) {
  if (amountMinor === null) return null;

  return new Intl.NumberFormat(locale === "sk" ? "sk-SK" : "en-IE", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

function formatDeadline(expiresAt: string | null, locale: "en" | "sk") {
  if (!expiresAt) return null;

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid offer deadline.");

  const formatted = new Intl.DateTimeFormat(
    locale === "sk" ? "sk-SK" : "en-IE",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    },
  ).format(date);

  return `${formatted} UTC`;
}

function amountParagraph(
  amount: string | null,
  slovak: boolean,
  label: "confirmed" | "offered",
) {
  if (!amount) return null;
  if (label === "offered") {
    return slovak
      ? `Vaša ponúknutá suma je ${amount}.`
      : `Your offered amount is ${amount}.`;
  }
  return slovak
    ? `Potvrdená suma je ${amount}.`
    : `The confirmed amount is ${amount}.`;
}

function contentFor(
  job: AuctionResultEmailJob,
  amount: string | null,
  deadline: string | null,
): EmailContent {
  const slovak = job.locale === "sk";

  switch (job.notificationType) {
    case "offer_issued": {
      if (job.recipientIsOwner || !amount || !deadline) {
        throw new Error("The offer email requires a bidder, amount, and deadline.");
      }
      const offeredAmount = amountParagraph(amount, slovak, "offered");
      if (!offeredAmount) throw new Error("The offer amount is unavailable.");
      return {
        subject: slovak
          ? `Potvrďte záujem – ${job.auctionTitle}`
          : `Confirm your interest – ${job.auctionTitle}`,
        heading: slovak ? "Aukcia sa skončila" : "The auction has ended",
        paragraphs: slovak
          ? [
              "Aukcia sa skončila. Potvrďte, či máte záujem kúpiť predmet za sumu, ktorú ste ponúkli.",
              offeredAmount,
              `Odpovedzte do ${deadline}.`,
              "Ak ponuku odmietnete alebo termín uplynie, QRBid môže osloviť ďalšieho záujemcu.",
            ]
          : [
              "The auction has ended. Confirm whether you want to buy the item for the amount you offered.",
              offeredAmount,
              `Respond by ${deadline}.`,
              "If you decline or the deadline passes, QRBid may contact the next interested bidder.",
            ],
        action: slovak
          ? "Otvoriť ponuku a odpovedať"
          : "Open and respond",
      };
    }
    case "interest_confirmed": {
      const confirmedAmount = amountParagraph(amount, slovak, "confirmed");
      if (job.recipientIsOwner) {
        return {
          subject: slovak
            ? `Záujemca potvrdil záujem – ${job.auctionTitle}`
            : `A bidder confirmed interest – ${job.auctionTitle}`,
          heading: slovak
            ? "Záujemca chce pokračovať"
            : "The bidder wants to continue",
          paragraphs: [
            slovak
              ? "Záujemca potvrdil, že chce pokračovať. V správe aukcie nájdete jeho overený e-mail."
              : "The bidder confirmed that they want to continue. Their verified email is available in auction management.",
            ...(confirmedAmount ? [confirmedAmount] : []),
            slovak
              ? "Napíšte mu a dohodnite si ďalší postup. Potvrdenie nie je platba ani automatické dokončenie predaja v QRBid."
              : "Contact them to agree on the next steps. Confirmation is not payment or automatic sale completion in QRBid.",
          ],
          action: slovak
            ? "Zobraziť kontakt v QRBid"
            : "View contact in QRBid",
        };
      }
      return {
        subject: slovak
          ? `Váš záujem bol potvrdený – ${job.auctionTitle}`
          : `Your interest was confirmed – ${job.auctionTitle}`,
        heading: slovak
          ? "Zaznamenali sme vaše potvrdenie"
          : "We recorded your confirmation",
        paragraphs: [
          slovak
            ? "Zaznamenali sme vaše potvrdenie. V časti Moje ponuky nájdete overený e-mail vlastníka a môžete sa dohodnúť na ďalšom postupe."
            : "We recorded your confirmation. The owner's verified email is available in My Bids so you can agree on the next steps.",
          ...(confirmedAmount ? [confirmedAmount] : []),
          slovak
            ? "Potvrdenie nie je platba ani automatické dokončenie predaja v QRBid."
            : "Confirmation is not payment or automatic sale completion in QRBid.",
        ],
        action: slovak
          ? "Zobraziť kontakt v QRBid"
          : "View contact in QRBid",
      };
    }
    case "no_bids":
      if (!job.recipientIsOwner) {
        throw new Error("The no-bids email is owner-only.");
      }
      return {
        subject: slovak
          ? `Aukcia skončila bez ponúk – ${job.auctionTitle}`
          : `Auction ended without bids – ${job.auctionTitle}`,
        heading: slovak
          ? "Aukcia skončila bez ponúk"
          : "The auction ended without bids",
        paragraphs: [
          slovak
            ? "Aukcia sa skončila a do stanoveného termínu neprišla žiadna ponuka. Podrobnosti nájdete v správe aukcie."
            : "The auction ended without receiving a bid before the deadline. Details are available in auction management.",
        ],
        action: slovak
          ? "Otvoriť správu aukcie"
          : "Open auction management",
      };
    case "ranking_exhausted":
      if (!job.recipientIsOwner) {
        throw new Error("The exhausted-ranking email is owner-only.");
      }
      return {
        subject: slovak
          ? `Aukcia skončila bez potvrdeného záujemcu – ${job.auctionTitle}`
          : `Auction ended without a confirmed bidder – ${job.auctionTitle}`,
        heading: slovak
          ? "Bez potvrdeného záujemcu"
          : "No bidder confirmed interest",
        paragraphs: [
          slovak
            ? "Aukcia sa skončila bez potvrdeného záujemcu. Ak to chcete skúsiť znova, môžete vytvoriť novú aukciu."
            : "The auction ended without a confirmed bidder. You can create a new auction if you want to try again.",
        ],
        action: slovak
          ? "Otvoriť správu aukcie"
          : "Open auction management",
      };
    case "sale_completed": {
      const confirmedAmount = amountParagraph(amount, slovak, "confirmed");
      if (job.recipientIsOwner) {
        return {
          subject: slovak
            ? `Dokončenie predaja zaznamenané – ${job.auctionTitle}`
            : `Sale completion recorded – ${job.auctionTitle}`,
          heading: slovak
            ? "Predaj ste označili ako dokončený"
            : "You marked the sale as completed",
          paragraphs: [
            slovak
              ? "Predaj ste v QRBid označili ako dokončený. Podrobnosti nájdete v správe aukcie."
              : "You marked the sale as completed in QRBid. Details are available in auction management.",
            ...(confirmedAmount ? [confirmedAmount] : []),
          ],
          action: slovak
            ? "Zobraziť výsledok aukcie"
            : "View auction result",
        };
      }
      return {
        subject: slovak
          ? `Vlastník zaznamenal dokončenie predaja – ${job.auctionTitle}`
          : `The owner recorded sale completion – ${job.auctionTitle}`,
        heading: slovak
          ? "Vlastník označil predaj ako dokončený"
          : "The owner marked the sale as completed",
        paragraphs: [
          slovak
            ? "Vlastník v QRBid označil predaj za dokončený. Výsledok nájdete v časti Moje ponuky."
            : "The owner marked the sale as completed in QRBid. The result is available in My Bids.",
          ...(confirmedAmount ? [confirmedAmount] : []),
        ],
        action: slovak
          ? "Zobraziť výsledok v Mojich ponukách"
          : "View result in My Bids",
      };
    }
    default:
      throw new Error("Unsupported notification type.");
  }
}

export function buildAuctionResultEmail(
  job: AuctionResultEmailJob,
  appUrl: string,
): AuctionResultEmail {
  const ownerPath = `/${job.locale}/my-auctions/${job.auctionId}`;
  const bidderPath = `/${job.locale}/my-bids`;
  const targetPath = job.recipientIsOwner ? ownerPath : bidderPath;
  const link = new URL(targetPath, appUrl).toString();
  const amount = formatAmount(job.amountMinor, job.locale, job.currency);
  const deadline = formatDeadline(job.expiresAt, job.locale);
  const content = contentFor(job, amount, deadline);
  const safeTitle = escapeHtml(job.auctionTitle);

  const text = `${content.heading}\n\n${job.auctionTitle}\n\n${content.paragraphs.join("\n\n")}\n\n${content.action}: ${link}`;
  const html = `<!doctype html>
<html lang="${job.locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(content.subject)}</title>
  </head>
  <body style="margin:0;background:#faf6f0;color:#2e322f;font-family:Arial,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background:#faf6f0">
      <tr>
        <td align="center" style="padding:24px 12px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;border-collapse:separate;background:#fffdf9;border:1px solid #e6ddd1;border-radius:12px">
            <tr>
              <td style="padding:28px 22px">
                <p style="margin:0 0 8px;color:#4a7c59;font-size:16px;font-weight:700">QRBid</p>
                <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25">${escapeHtml(content.heading)}</h1>
                <h2 style="margin:0 0 18px;font-size:18px;line-height:1.4">${safeTitle}</h2>
                ${content.paragraphs.map((paragraph) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.6">${escapeHtml(paragraph)}</p>`).join("\n                ")}
                <p style="margin:24px 0 0">
                  <a href="${escapeHtml(link)}" style="display:block;border-radius:10px;background:#4a7c59;color:#fff;padding:13px 18px;text-align:center;text-decoration:none;font-size:16px;font-weight:700">${escapeHtml(content.action)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, subject: content.subject, text };
}
