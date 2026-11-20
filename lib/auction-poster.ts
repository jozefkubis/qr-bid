import type {
  Column,
  Content,
  TCreatedPdf,
  TDocumentDefinitions,
} from "pdfmake/interfaces";

type AuctionPosterCopy = {
  endsAt: string;
  footer: string;
  location: string;
  locationUnavailable: string;
  privateAuction: string;
  publicLink: string;
  scan: string;
  scanDescription: string;
};

type AuctionPosterInput = {
  copy: AuctionPosterCopy;
  endsAt: string;
  logoUrl: string | null;
  location: string | null;
  photoUrl: string | null;
  publicUrl: string;
  title: string;
};

type AuctionPosterDefinitionInput = Omit<
  AuctionPosterInput,
  "logoUrl" | "photoUrl"
> & {
  logoDataUrl: string | null;
  photoDataUrl: string | null;
  qrSvg: string;
};

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const CONTENT_WIDTH = 511;
const TERRA_BACKGROUND = "#ffffff";
const TERRA_PRIMARY = "#4a7c59";
const TERRA_TEXT = "#2e322f";
const TERRA_MUTED = "#626a64";
const TERRA_BORDER = "#d5e2d8";
const TERRA_SURFACE = "#fafbf9";
const TERRA_ICON_SURFACE = "#edf5ef";
const TERRA_DIVIDER = "#e4e9e5";
const CARD_RADIUS = 10;
const MAP_PIN_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 1 1 16 0Z" stroke="${TERRA_PRIMARY}" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke="${TERRA_PRIMARY}" stroke-width="2"/></svg>`;
const CLOCK_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="${TERRA_PRIMARY}" stroke-width="2"/><path d="M12 7v5l3.5 2" stroke="${TERRA_PRIMARY}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const LINK_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 1 1 0 10h-2M8 12h8" stroke="${TERRA_PRIMARY}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function unwrapDefault<T>(module: T) {
  const interopModule = module as T & { default?: T };
  return interopModule.default ?? module;
}

async function createQrSvg(publicUrl: string) {
  const { create } = await import("qrcode");
  const qr = create(publicUrl, { errorCorrectionLevel: "H" });
  const quietZone = 4;
  const viewBoxSize = qr.modules.size + quietZone * 2;
  const path: string[] = [];

  for (let row = 0; row < qr.modules.size; row += 1) {
    for (let column = 0; column < qr.modules.size; column += 1) {
      if (qr.modules.get(row, column)) {
        path.push(`M${column + quietZone} ${row + quietZone}h1v1h-1z`);
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges"><rect width="${viewBoxSize}" height="${viewBoxSize}" fill="#ffffff"/><path d="${path.join("")}" fill="${TERRA_TEXT}"/></svg>`;
}

async function photoToJpegDataUrl(photoUrl: string) {
  const response = await fetch(photoUrl);
  if (!response.ok) throw new Error("The auction photo could not be loaded.");

  const bitmap = await createImageBitmap(await response.blob());
  const targetWidth = 1533;
  const targetHeight = 576;
  const targetRatio = targetWidth / targetHeight;
  const sourceRatio = bitmap.width / bitmap.height;
  const sourceWidth =
    sourceRatio > targetRatio ? bitmap.height * targetRatio : bitmap.width;
  const sourceHeight =
    sourceRatio > targetRatio ? bitmap.height : bitmap.width / targetRatio;
  const sourceX = (bitmap.width - sourceWidth) / 2;
  const sourceY = (bitmap.height - sourceHeight) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("The auction photo could not be prepared.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.beginPath();
  context.roundRect(0, 0, canvas.width, canvas.height, 36);
  context.clip();
  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  context.restore();
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.88);
}

async function logoToJpegDataUrl(imageUrl: string) {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("The QRBid logo could not be loaded.");

  const bitmap = await createImageBitmap(await response.blob());
  const scale = Math.min(1, 256 / bitmap.width, 256 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("The QRBid logo could not be prepared.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.92);
}

function buildInfoCard({
  icon,
  label,
  value,
  width,
}: {
  icon: string;
  label: string;
  value: string;
  width: number;
}): Column {
  return {
    width,
    stack: [
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: width,
            h: 50,
            r: CARD_RADIUS,
            color: TERRA_SURFACE,
            lineColor: TERRA_BORDER,
            lineWidth: 0.8,
          },
        ],
      },
      {
        columns: [
          {
            width: 32,
            stack: [
              {
                canvas: [
                  {
                    type: "rect",
                    x: 0,
                    y: 0,
                    w: 30,
                    h: 30,
                    r: 7,
                    color: TERRA_ICON_SURFACE,
                  },
                ],
              },
              {
                svg: icon,
                fit: [18, 18],
                margin: [6, -24, 6, 6],
              },
            ],
          },
          {
            width: "*",
            stack: [
              {
                text: label,
                bold: true,
                color: TERRA_MUTED,
                fontSize: 8,
                margin: [0, 0, 0, 3],
              },
              {
                text: value,
                bold: true,
                color: TERRA_TEXT,
                fontSize: 10.5,
                lineHeight: 1.1,
              },
            ],
          },
        ],
        columnGap: 10,
        margin: [14, -40, 14, 10],
      },
    ],
  };
}

export function buildAuctionPosterDefinition({
  copy,
  endsAt,
  logoDataUrl,
  location,
  photoDataUrl,
  publicUrl,
  qrSvg,
  title,
}: AuctionPosterDefinitionInput): TDocumentDefinitions {
  const brandColumns: Column[] = [];

  if (logoDataUrl) {
    brandColumns.push({
      width: 32,
      image: logoDataUrl,
      fit: [30, 30],
    });
  }

  brandColumns.push({
    width: "*",
    text: "QRBid",
    bold: true,
    color: TERRA_TEXT,
    fontSize: 14,
    margin: [0, 6, 0, 0],
  });

  const content: Content[] = [
    {
      columns: [
        {
          width: "*",
          columns: brandColumns,
          columnGap: 8,
        },
        {
          width: 116,
          stack: [
            {
              canvas: [
                {
                  type: "rect",
                  x: 0,
                  y: 0,
                  w: 116,
                  h: 25,
                  r: 12.5,
                  color: "#f5faf6",
                  lineColor: TERRA_BORDER,
                  lineWidth: 0.7,
                },
              ],
            },
            {
              columns: [
                {
                  width: 9,
                  canvas: [
                    {
                      type: "ellipse",
                      x: 2,
                      y: 5,
                      r1: 2.5,
                      r2: 2.5,
                      color: TERRA_PRIMARY,
                    },
                  ],
                },
                {
                  width: "*",
                  text: copy.privateAuction,
                  bold: true,
                  color: TERRA_PRIMARY,
                  fontSize: 8.5,
                  margin: [0, 1, 0, 0],
                },
              ],
              columnGap: 4,
              margin: [11, -18, 9, 7],
            },
          ],
          margin: [0, 2, 0, 0],
        },
      ],
      columnGap: 16,
    },
    {
      canvas: [
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: CONTENT_WIDTH,
          y2: 0,
          lineColor: TERRA_DIVIDER,
          lineWidth: 0.7,
        },
      ],
      margin: [0, 10, 0, 13],
    },
    {
      text: title,
      bold: true,
      color: TERRA_TEXT,
      fontSize: 27,
      lineHeight: 1.05,
      margin: [0, 0, 0, 12],
    },
  ];

  const metaBlocks: Column[] = [];
  const metaWidth = (CONTENT_WIDTH - 12) / 2;

  metaBlocks.push(
    buildInfoCard({
      icon: MAP_PIN_SVG,
      label: copy.location,
      value: location?.trim() || copy.locationUnavailable,
      width: metaWidth,
    }),
  );

  metaBlocks.push(
    buildInfoCard({
      icon: CLOCK_SVG,
      label: copy.endsAt,
      value: endsAt,
      width: metaWidth,
    }),
  );

  content.push({
    columns: metaBlocks,
    columnGap: 12,
  });

  if (photoDataUrl) {
    content.push({
      image: photoDataUrl,
      width: CONTENT_WIDTH,
      height: 240,
      margin: [0, 15, 0, 0],
    });
  }

  content.push(
    {
      stack: [
        {
          canvas: [
            {
              type: "rect",
              x: 0,
              y: 0,
              w: CONTENT_WIDTH,
              h: 206,
              r: CARD_RADIUS,
              color: TERRA_SURFACE,
              lineColor: TERRA_BORDER,
              lineWidth: 1,
            },
          ],
        },
        {
          columns: [
            {
              width: 194,
              stack: [
                {
                  canvas: [
                    {
                      type: "rect",
                      x: 0,
                      y: 0,
                      w: 194,
                      h: 178,
                      r: 8,
                      color: "#ffffff",
                      lineColor: "#ded7cb",
                      lineWidth: 0.6,
                    },
                  ],
                },
                {
                  svg: qrSvg,
                  fit: [166, 166],
                  margin: [14, -172, 14, 6],
                },
              ],
            },
            {
              width: "*",
              stack: [
                {
                  text: copy.scan,
                  bold: true,
                  color: TERRA_TEXT,
                  fontSize: 19,
                  lineHeight: 1.05,
                  margin: [0, 50, 0, 12],
                },
                {
                  text: copy.scanDescription,
                  color: TERRA_MUTED,
                  fontSize: 11,
                  lineHeight: 1.25,
                },
              ],
            },
          ],
          columnGap: 18,
          margin: [14, -192, 14, 14],
        },
      ],
      margin: [0, 17, 0, 19],
    },
    {
      text: copy.publicLink,
      color: TERRA_MUTED,
      fontSize: 10.5,
      bold: true,
      margin: [4, 0, 0, 8],
    },
    {
      stack: [
        {
          canvas: [
            {
              type: "rect",
              x: 0,
              y: 0,
              w: CONTENT_WIDTH,
              h: 50,
              r: CARD_RADIUS,
              color: TERRA_SURFACE,
              lineColor: TERRA_BORDER,
              lineWidth: 0.8,
            },
          ],
        },
        {
          columns: [
            {
              width: 22,
              svg: LINK_SVG,
              fit: [18, 18],
            },
            {
              width: "*",
              text: publicUrl,
              bold: true,
              color: TERRA_PRIMARY,
              fontSize: 9.5,
              link: publicUrl,
              lineHeight: 1.15,
              margin: [0, 3, 0, 0],
            },
          ],
          columnGap: 8,
          margin: [14, -35, 14, 15],
        },
      ],
    },
  );

  return {
    background: {
      canvas: [
        {
          type: "rect",
          x: 0,
          y: 0,
          w: A4_WIDTH,
          h: A4_HEIGHT,
          color: TERRA_BACKGROUND,
        },
      ],
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

export async function createAuctionPoster(
  input: AuctionPosterInput,
): Promise<TCreatedPdf> {
  const [logoDataUrl, photoDataUrl, qrSvg] = await Promise.all([
    input.logoUrl ? logoToJpegDataUrl(input.logoUrl) : null,
    input.photoUrl ? photoToJpegDataUrl(input.photoUrl) : null,
    createQrSvg(input.publicUrl),
  ]);
  const [pdfMakeModule, pdfFonts] = await Promise.all([
    import("pdfmake/build/pdfmake.js"),
    import("pdfmake/build/vfs_fonts.js"),
  ]);
  const pdfMake = unwrapDefault(pdfMakeModule);

  pdfMake.addVirtualFileSystem(pdfFonts.default);
  return pdfMake.createPdf(
    buildAuctionPosterDefinition({
      ...input,
      logoDataUrl,
      photoDataUrl,
      qrSvg,
    }),
  );
}
