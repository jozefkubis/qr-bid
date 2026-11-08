import { getTranslations } from "next-intl/server";
import { CreateAuctionLink } from "@/components/auth/create-auction-link";

export async function FinalCta() {
  const t = await getTranslations("FinalCta");
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-surface-muted pb-12 sm:pb-16 lg:pb-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-soft bg-primary p-6 text-white shadow-soft sm:p-10 lg:p-14">
          <div className="max-w-3xl">
            <p className="text-sm font-bold tracking-wide">{t("eyebrow")}</p>
            <h2
              id="final-cta-heading"
              className="mt-5 text-3xl leading-tight font-medium sm:text-4xl lg:text-5xl"
            >
              {t("title")}
            </h2>
            <p className="mt-6 text-lg leading-relaxed">
              {t("description")}
            </p>
            <CreateAuctionLink
              className="mt-8 inline-flex min-h-11 items-center justify-center rounded-soft border border-surface bg-surface px-5 py-2.5 font-semibold text-primary-hover transition-colors hover:border-surface-muted hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
