import { BellRing, Clock, Printer, QrCode, SlidersHorizontal, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";

const stepIcons = [
  {
    icon: SlidersHorizontal,
    footerIcon: Clock,
  },
  {
    icon: QrCode,
    footerIcon: Printer,
  },
  {
    icon: BellRing,
    footerIcon: Zap,
  },
];

export async function HowItWorks() {
  const t = await getTranslations("HowItWorks");
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="border-t border-border bg-surface-muted py-12 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold tracking-wide text-tertiary">
            {t("eyebrow")}
          </p>
          <h2
            id="how-it-works-heading"
            className="mt-3 text-3xl leading-tight font-medium sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <ol className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-3">
          {stepIcons.map(({ icon: Icon, footerIcon: FooterIcon }, index) => {
            const step = String(index + 1) as "1" | "2" | "3";
            return <li key={step}>
              <Card className="flex h-full flex-col sm:p-8">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <p className="mt-7 text-xs font-bold tracking-wide text-tertiary">
                  {t(`steps.${step}.label`)}
                </p>
                <h3 className="mt-2 text-2xl leading-snug font-medium">{t(`steps.${step}.title`)}</h3>
                <p className="mt-4 pb-7 leading-relaxed text-muted-foreground">
                  {t(`steps.${step}.description`)}
                </p>
                <p className="mt-auto flex items-start gap-2 border-t border-border pt-5 text-sm font-semibold text-muted-foreground">
                  <FooterIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{t(`steps.${step}.footer`)}</span>
                </p>
              </Card>
            </li>;
          })}
        </ol>
      </div>
    </section>
  );
}
