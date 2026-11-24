import Image from "next/image";
import logo from "/public/logo.png";
import { Link } from "@/i18n/navigation";

type LogoProps = {
  closeMenu: () => void;
};

export function Logo({ closeMenu }: LogoProps) {
  return (
    <div>
      <Link
        href="/"
        className="inline-flex min-h-11 shrink-0 items-center gap-0 rounded-soft font-heading text-lg font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:text-xl"
        onClick={closeMenu}
      >
        <span
          className="relative block size-8 shrink-0 overflow-hidden sm:size-9"
          aria-hidden="true"
        >
          <Image
            src={logo}
            alt=""
            width={80}
            height={80}
            priority
            // className="absolute -top-[0.5625rem] -left-[1.375rem] h-[3.25rem] w-[8.6667rem] max-w-none"
          />
        </span>
        <span>QRBid</span>
      </Link>
    </div>
  );
}
