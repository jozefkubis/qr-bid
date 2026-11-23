import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { buildAuctionResultEmail } from "../lib/email/auction-result-email.ts";

const outputDirectory = resolve("tmp/email-previews");
const previewAppUrl = "https://preview.getqrbid.test";
const auctionId = "11111111-2222-4333-8444-555555555555";
const auctionTitle = "Parkovacie miesto A&B – Kvetnica";

const combinations = [
  { key: "offer-bidder", notificationType: "offer_issued", recipientIsOwner: false },
  { key: "interest-owner", notificationType: "interest_confirmed", recipientIsOwner: true },
  { key: "interest-bidder", notificationType: "interest_confirmed", recipientIsOwner: false },
  { key: "no-bids-owner", notificationType: "no_bids", recipientIsOwner: true },
  { key: "exhausted-owner", notificationType: "ranking_exhausted", recipientIsOwner: true },
  { key: "completed-owner", notificationType: "sale_completed", recipientIsOwner: true },
  { key: "completed-bidder", notificationType: "sale_completed", recipientIsOwner: false },
];

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

function previewJob(locale, combination) {
  const hasOffer = combination.notificationType !== "no_bids" && combination.notificationType !== "ranking_exhausted";
  return {
    amountMinor: hasOffer ? 8450 : null,
    auctionId,
    auctionTitle,
    currency: "EUR",
    expiresAt: combination.notificationType === "offer_issued" ? "2026-11-25T19:30:00.000Z" : null,
    locale,
    notificationType: combination.notificationType,
    recipientIsOwner: combination.recipientIsOwner,
  };
}

function expectedLink(locale, recipientIsOwner) {
  const path = recipientIsOwner
    ? `/${locale}/my-auctions/${auctionId}`
    : `/${locale}/my-bids`;
  return new URL(path, previewAppUrl).toString();
}

await mkdir(outputDirectory, { recursive: true });

const previews = [];
for (const locale of ["en", "sk"]) {
  for (const combination of combinations) {
    const job = previewJob(locale, combination);
    const email = buildAuctionResultEmail(job, previewAppUrl);
    const filename = `${locale}-${combination.key}`;
    const link = expectedLink(locale, combination.recipientIsOwner);
    const htmlActionCount = (email.html.match(/<a href=/g) ?? []).length;

    if (!email.subject.includes(auctionTitle)) {
      throw new Error(`${filename}: subject does not include the auction title.`);
    }
    if (htmlActionCount !== 1 || !email.html.includes(link) || !email.text.includes(link)) {
      throw new Error(`${filename}: HTML/text action link validation failed.`);
    }
    if (email.html.includes("undefined") || email.text.includes("undefined")) {
      throw new Error(`${filename}: preview contains an undefined value.`);
    }
    if (combination.notificationType === "offer_issued") {
      if (!email.text.includes("84") || !email.text.includes("UTC")) {
        throw new Error(`${filename}: offer amount or UTC deadline is missing.`);
      }
    }

    await Promise.all([
      writeFile(join(outputDirectory, `${filename}.html`), email.html, "utf8"),
      writeFile(
        join(outputDirectory, `${filename}.txt`),
        `Subject: ${email.subject}\n\n${email.text}\n`,
        "utf8",
      ),
    ]);
    previews.push({ ...combination, email, filename, locale });
  }
}

const index = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>QRBid auction result email previews</title>
    <style>
      body { margin: 0; padding: 24px; background: #f3ede4; color: #2e322f; font-family: Arial, sans-serif; }
      main { max-width: 1200px; margin: 0 auto; }
      section { margin: 28px 0; padding: 20px; border: 1px solid #d9d0c4; border-radius: 12px; background: #fffdf9; }
      iframe { width: 100%; height: 620px; border: 1px solid #d9d0c4; border-radius: 8px; background: white; }
      pre { overflow: auto; padding: 16px; border-radius: 8px; background: #faf6f0; white-space: pre-wrap; }
      a { color: #4a7c59; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <h1>QRBid auction result email previews</h1>
      <p>Fictional local fixtures only. No email was sent.</p>
      ${previews.map(({ email, filename, locale, notificationType, recipientIsOwner }) => `<section>
        <h2>${escapeHtml(locale.toUpperCase())} · ${escapeHtml(notificationType)} · ${recipientIsOwner ? "owner" : "bidder"}</h2>
        <p><strong>Subject:</strong> ${escapeHtml(email.subject)}</p>
        <p><a href="${filename}.html">Open HTML only</a> · <a href="${filename}.txt">Open text only</a></p>
        <iframe title="${escapeHtml(filename)} email preview" src="${filename}.html"></iframe>
        <h3>Text version</h3>
        <pre>${escapeHtml(email.text)}</pre>
      </section>`).join("\n")}
    </main>
  </body>
</html>`;

await writeFile(join(outputDirectory, "index.html"), index, "utf8");
console.log(`Generated and validated ${previews.length} previews in ${outputDirectory}`);
