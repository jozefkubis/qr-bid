import { CreateAuctionLink } from "@/components/auth/create-auction-link";

export function FinalCta() {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="bg-surface-muted pb-12 sm:pb-16 lg:pb-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-soft bg-primary p-6 text-white shadow-soft sm:p-10 lg:p-14">
          <div className="max-w-3xl">
            <p className="text-sm font-bold tracking-wide">READY TO GET STARTED?</p>
            <h2
              id="final-cta-heading"
              className="mt-5 text-3xl leading-tight font-medium sm:text-4xl lg:text-5xl"
            >
              Ready to create your first auction?
            </h2>
            <p className="mt-6 text-lg leading-relaxed">
              Set up your auction, share a link or QR code, and let interested
              people place their bids.
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
