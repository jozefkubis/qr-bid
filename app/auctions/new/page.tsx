import type { Metadata } from "next";
import { CreateAuctionForm } from "@/components/auctions/create-auction-form";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = { title: "Create an auction — QRBid" };

export default function CreateAuctionPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold sm:text-4xl">Create an auction</h1>
        <p className="mt-3 mb-8 text-muted-foreground">Add your auction details and choose when bidding ends.</p>
        <p id="auction-preview" className="mb-5 text-sm text-tertiary">UI preview only. Changes stay in this page and are not saved.</p>
        <CreateAuctionForm />
      </main>
      <SiteFooter />
    </>
  );
}
