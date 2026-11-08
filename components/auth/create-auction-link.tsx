"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type CreateAuctionLinkProps = {
  className: string;
  onClick?: () => void;
  showArrow?: boolean;
};

function LinkContent({ label, showArrow }: { label: string; showArrow: boolean }) {
  return (
    <>
      {label}
      {showArrow ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
    </>
  );
}

export function CreateAuctionLink({ className, onClick, showArrow = false }: CreateAuctionLinkProps) {
  const locale = useLocale();
  const t = useTranslations("Navigation");
  const content = <LinkContent label={t("createAuction")} showArrow={showArrow} />;

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl={`/${locale}/auctions/new`}>
          <button type="button" className={className} onClick={onClick}>
            {content}
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <Link href="/auctions/new" className={className} onClick={onClick}>
          {content}
        </Link>
      </Show>
    </>
  );
}
