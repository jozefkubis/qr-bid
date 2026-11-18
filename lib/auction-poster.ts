import type { Content, TCreatedPdf, TDocumentDefinitions } from "pdfmake/interfaces";

type AuctionPosterCopy = {
  footer: string;
  publicLink: string;
  scan: string;
};

type AuctionPosterInput = {
  copy: AuctionPosterCopy;
  location: string | null;
  photoUrl: string | null;
  publicUrl: string;
  title: string;
};

type AuctionPosterDefinitionInput = Omit<AuctionPosterInput, "photoUrl"> & {
  photoDataUrl: string | null;
};

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const TERRA_BACKGROUND = "#faf6f0";
const TERRA_PRIMARY = "#4a7c59";
const TERRA_TEXT = "#2e322f";
const TERRA_MUTED = "#626a64";

function unwrapDefault<T>(module: T) {
  const interopModule = module as T & { default?: T };
  return interopModule.default ?? module;
}

async function photoToJpegDataUrl(photoUrl: string) {
  const response = await fetch(photoUrl);
  if (!response.ok) throw new Error("The auction photo could not be loaded.");

  const bitmap = await createImageBitmap(await response.blob());
  const scale = Math.min(1, 1600 / bitmap.width, 1000 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("The auction photo could not be prepared.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.88);
}

export function buildAuctionPosterDefinition({
  copy,
  location,
  photoDataUrl,
  publicUrl,
  title,
}: AuctionPosterDefinitionInput): TDocumentDefinitions {
  const content: Content[] = [
    {
      text: "QRBid",
      alignment: "center",
      bold: true,
      color: TERRA_PRIMARY,
      fontSize: 18,
      margin: [0, 0, 0, 14],
    },
    {
      text: title,
      alignment: "center",
      bold: true,
      color: TERRA_TEXT,
      fontSize: 30,
      lineHeight: 1.05,
      margin: [0, 0, 0, location ? 7 : 16],
    },
  ];

  if (location) {
    content.push({
      text: location,
      alignment: "center",
      color: TERRA_MUTED,
      fontSize: 13,
      margin: [0, 0, 0, 16],
    });
  }

  if (photoDataUrl) {
    content.push({
      image: photoDataUrl,
      cover: { width: 511, height: 175, align: "center", valign: "center" },
      margin: [0, 0, 0, 14],
    });
  }

  content.push(
    {
      table: {
        widths: ["*"],
        body: [[{
          stack: [{
            qr: publicUrl,
            alignment: "center",
            background: "#ffffff",
            eccLevel: "H",
            fit: photoDataUrl ? 205 : 250,
            foreground: TERRA_TEXT,
          }],
          border: [false, false, false, false],
          fillColor: "#ffffff",
          margin: [22, 22, 22, 22],
        }]],
      },
      layout: "noBorders",
      margin: photoDataUrl ? [100, 0, 100, 10] : [78, 24, 78, 18],
    },
    {
      text: copy.scan,
      alignment: "center",
      bold: true,
      color: TERRA_TEXT,
      fontSize: 15,
      margin: [24, 0, 24, 7],
    },
    {
      text: copy.publicLink,
      alignment: "center",
      color: TERRA_MUTED,
      fontSize: 9,
      margin: [0, 0, 0, 3],
    },
    {
      text: publicUrl,
      alignment: "center",
      color: TERRA_PRIMARY,
      fontSize: 9,
      link: publicUrl,
      margin: [10, 0, 10, 0],
    },
  );

  return {
    background: {
      canvas: [{
        type: "rect",
        x: 0,
        y: 0,
        w: A4_WIDTH,
        h: A4_HEIGHT,
        color: TERRA_BACKGROUND,
      }],
    },
    content,
    defaultStyle: { font: "Roboto" },
    footer: {
      text: copy.footer,
      alignment: "center",
      color: TERRA_MUTED,
      fontSize: 8,
      margin: [42, 0, 42, 0],
    },
    info: {
      author: "QRBid",
      subject: copy.scan,
      title,
    },
    pageMargins: [42, 34, 42, 34],
    pageOrientation: "portrait",
    pageSize: "A4",
  };
}

export async function createAuctionPoster(input: AuctionPosterInput): Promise<TCreatedPdf> {
  const photoDataUrl = input.photoUrl
    ? await photoToJpegDataUrl(input.photoUrl)
    : null;
  const [pdfMakeModule, pdfFonts] = await Promise.all([
    import("pdfmake/build/pdfmake.js"),
    import("pdfmake/build/vfs_fonts.js"),
  ]);
  const pdfMake = unwrapDefault(pdfMakeModule);

  pdfMake.addVirtualFileSystem(pdfFonts.default);
  return pdfMake.createPdf(buildAuctionPosterDefinition({
    ...input,
    photoDataUrl,
  }));
}
