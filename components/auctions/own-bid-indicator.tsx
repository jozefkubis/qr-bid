"use client";

import Image from "next/image";
import { useState } from "react";

export function OwnBidIndicator({ avatarUrl, label }: { avatarUrl: string | null; label: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!avatarUrl || failedUrl === avatarUrl) {
    return <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{label}</span>;
  }

  return (
    <>
      <Image
        src={avatarUrl}
        alt=""
        unoptimized
        width={20}
        height={20}
        className="size-5 shrink-0 rounded-full object-cover"
        onError={() => setFailedUrl(avatarUrl)}
      />
      <span className="sr-only">{label}</span>
    </>
  );
}
