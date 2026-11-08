"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type CreateAuctionLinkProps = {
  className: string;
  onClick?: () => void;
  showArrow?: boolean;
};

function LinkContent({ showArrow }: Pick<CreateAuctionLinkProps, "showArrow">) {
  return (
    <>
      Create an auction
      {showArrow ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
    </>
  );
}

function AuthTrigger({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className: string;
  onClick?: () => void;
}) {
  return (
    <SignInButton mode="modal" forceRedirectUrl="/auctions/new">
      <button type="button" className={className} onClick={onClick}>
        {children}
      </button>
    </SignInButton>
  );
}

export function CreateAuctionLink({
  className,
  onClick,
  showArrow = false,
}: CreateAuctionLinkProps) {
  const content = <LinkContent showArrow={showArrow} />;

  return (
    <>
      <Show when="signed-out">
        <AuthTrigger className={className} onClick={onClick}>
          {content}
        </AuthTrigger>
      </Show>
      <Show when="signed-in">
        <Link href="/auctions/new" className={className} onClick={onClick}>
          {content}
        </Link>
      </Show>
    </>
  );
}
