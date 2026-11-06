import { BellRing, Clock, Printer, QrCode, SlidersHorizontal, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    label: "STEP 01",
    title: "Create your auction",
    description:
      "Add a title, description, photos, starting price, minimum bid increment, and end date.",
    footer: "Set the rules for your auction",
    icon: SlidersHorizontal,
    footerIcon: Clock,
  },
  {
    label: "STEP 02",
    title: "Share the QR code",
    description:
      "Share a direct link or place a QR code on a printed A4 poster so interested people can open your auction.",
    footer: "Accessible through a direct link",
    icon: QrCode,
    footerIcon: Printer,
  },
  {
    label: "STEP 03",
    title: "Receive bids",
    description:
      "Registered participants can place bids online. Follow the current highest bid and see when the auction ends.",
    footer: "Bidding updates in real time",
    icon: BellRing,
    footerIcon: Zap,
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="border-t border-border bg-surface-muted py-12 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold tracking-wide text-tertiary">
            HOW IT WORKS
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl leading-tight font-medium sm:text-4xl"
          >
            How QRBid works
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Three simple steps to create an auction, share it with interested
            people, and receive bids online.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-3">
          {steps.map(({ label, title, description, footer, icon: Icon, footerIcon: FooterIcon }) => (
            <li key={label}>
              <Card className="flex h-full flex-col sm:p-8">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <p className="mt-7 text-xs font-bold tracking-wide text-tertiary">
                  {label}
                </p>
                <h3 className="mt-2 text-2xl leading-snug font-medium">{title}</h3>
                <p className="mt-4 pb-7 leading-relaxed text-muted-foreground">
                  {description}
                </p>
                <p className="mt-auto flex items-start gap-2 border-t border-border pt-5 text-sm font-semibold text-muted-foreground">
                  <FooterIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{footer}</span>
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
