"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createDemoAuctions, getEffectiveAuctionStatus, type DemoAuction } from "@/data/demo-auctions";

type AuctionUpdate = Pick<DemoAuction, "title" | "description" | "location" | "startingPriceMinor" | "minimumIncrementMinor" | "endAt">;
type DemoAuctionsContextValue = {
  auctions: DemoAuction[];
  now: number | null;
  updateAuction: (id: string, update: AuctionUpdate) => boolean;
  addNote: (id: string, text: string) => boolean;
  addPhotos: (id: string, files: File[]) => void;
  removePhoto: (id: string, url: string) => void;
  deleteAuction: (id: string) => boolean;
};

const DemoAuctionsContext = createContext<DemoAuctionsContextValue | null>(null);

export function DemoAuctionsProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState<number | null>(null);
  const [auctions, setAuctions] = useState<DemoAuction[]>([]);

  useEffect(() => {
    const current = Date.now();
    const initialization = window.setTimeout(() => {
      setNow(current);
      setAuctions(createDemoAuctions(current));
    }, 0);
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => { window.clearTimeout(initialization); window.clearInterval(interval); };
  }, []);

  const value = useMemo<DemoAuctionsContextValue>(() => ({
    auctions,
    now,
    updateAuction(id, update) {
      if (now === null) return false;
      const target = auctions.find((auction) => auction.id === id);
      if (!target || getEffectiveAuctionStatus(target, now) !== "active" || target.bids.length > 0) return false;
      setAuctions((current) => current.map((auction) => auction.id === id ? { ...auction, ...update } : auction));
      return true;
    },
    addNote(id, text) {
      if (now === null || !text.trim()) return false;
      const target = auctions.find((auction) => auction.id === id);
      if (!target || getEffectiveAuctionStatus(target, now) !== "active" || target.bids.length === 0) return false;
      setAuctions((current) => current.map((auction) => auction.id === id ? { ...auction, notes: [...auction.notes, { id: `local-note-${now}`, text: text.trim(), publishedAt: new Date(now).toISOString() }] } : auction));
      return true;
    },
    addPhotos(id, files) {
      if (now === null) return;
      const target = auctions.find((auction) => auction.id === id);
      if (!target || getEffectiveAuctionStatus(target, now) !== "active" || target.bids.length > 0) return;
      const urls = files.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type)).map(URL.createObjectURL);
      setAuctions((current) => current.map((auction) => auction.id === id ? { ...auction, photoUrls: [...auction.photoUrls, ...urls] } : auction));
    },
    removePhoto(id, url) {
      if (now === null) return;
      const target = auctions.find((auction) => auction.id === id);
      if (!target || getEffectiveAuctionStatus(target, now) !== "active" || target.bids.length > 0) return;
      setAuctions((current) => current.map((auction) => auction.id === id ? { ...auction, photoUrls: auction.photoUrls.filter((photo) => photo !== url) } : auction));
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    },
    deleteAuction(id) {
      if (now === null) return false;
      const auction = auctions.find((item) => item.id === id);
      if (!auction || getEffectiveAuctionStatus(auction, now) !== "active" || auction.bids.length > 0) return false;
      setAuctions((current) => current.filter((item) => item.id !== id));
      return true;
    },
  }), [auctions, now]);

  return <DemoAuctionsContext.Provider value={value}>{children}</DemoAuctionsContext.Provider>;
}

export function useDemoAuctions() {
  const context = useContext(DemoAuctionsContext);
  if (!context) throw new Error("useDemoAuctions must be used within DemoAuctionsProvider");
  return context;
}
