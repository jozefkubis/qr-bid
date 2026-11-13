"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { createPublicSupabaseBrowserClient } from "@/lib/supabase/client";

export function AuctionRealtimeRefresh({ auctionId, children }: { auctionId: string; children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createPublicSupabaseBrowserClient();
    const channel = supabase
      .channel(`auction:${auctionId}:bids`)
      .on("broadcast", { event: "bid_changed" }, () => router.refresh())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") router.refresh();
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [auctionId, router]);

  return children;
}
