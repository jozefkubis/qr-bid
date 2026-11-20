import { timingSafeEqual } from "node:crypto";
import { processAuctionNotificationOutbox } from "@/lib/notifications/process-auction-outbox";

function secretsMatch(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  if (!secretsMatch(request.headers.get("x-qrbid-worker-secret"), process.env.QRBID_WORKER_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processAuctionNotificationOutbox(10);
  return Response.json(result);
}
