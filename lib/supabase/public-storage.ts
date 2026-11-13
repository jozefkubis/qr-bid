export function getAuctionPhotoUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  const safePath = path.split("/").map(encodeURIComponent).join("/");
  return `${baseUrl}/storage/v1/object/public/auction-photos/${safePath}`;
}
