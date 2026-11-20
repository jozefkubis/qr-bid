import "server-only";

import { Resend, type ErrorResponse } from "resend";
import { getVerifiedClerkContact } from "@/lib/clerk-user";
import { buildAuctionResultEmail } from "@/lib/email/auction-result-email";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type OutboxJob = Database["public"]["Functions"]["claim_notification_outbox"]["Returns"][number];

function requiredEnvironmentVariable(name: "QRBID_APP_URL" | "RESEND_API_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function isTemporaryResendError(error: ErrorResponse) {
  if (error.name === "concurrent_idempotent_requests") return true;
  const status = error.statusCode;
  return status === null || status === 408 || status === 429 || status >= 500;
}

async function markFailed(job: OutboxJob, errorCode: string, temporary: boolean) {
  const supabase = createSupabaseAdminClient();
  const result = await supabase.rpc("mark_notification_outbox_failed", {
    p_job_id: job.job_id,
    p_error_code: errorCode,
    p_temporary: temporary,
  });
  if (result.error) throw result.error;
  return result.data;
}

export async function processAuctionNotificationOutbox(limit = 10) {
  const supabase = createSupabaseAdminClient();
  const claimed = await supabase.rpc("claim_notification_outbox", { p_limit: limit });
  if (claimed.error) throw claimed.error;

  const resend = new Resend(requiredEnvironmentVariable("RESEND_API_KEY"));
  const appUrl = requiredEnvironmentVariable("QRBID_APP_URL");
  let sent = 0;
  let retry = 0;
  let permanentFailure = 0;

  for (const job of claimed.data) {
    try {
      const recipient = await getVerifiedClerkContact(job.recipient_clerk_user_id);
      const email = buildAuctionResultEmail({
        amountMinor: job.amount_minor,
        auctionId: job.auction_id,
        auctionTitle: job.auction_title,
        currency: job.currency,
        expiresAt: job.expires_at,
        locale: job.locale,
        notificationType: job.notification_type,
        recipientIsOwner: job.recipient_is_owner,
      }, appUrl);
      const response = await resend.emails.send({
        from: "QRBid <aukcie@mail.getqrbid.com>",
        to: recipient.emailAddress,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }, { idempotencyKey: `qrbid-auction-result/${job.job_id}` });

      if (response.error) {
        const status = await markFailed(job, response.error.name, isTemporaryResendError(response.error));
        if (status === "retry") retry += 1;
        else permanentFailure += 1;
        continue;
      }

      const marked = await supabase.rpc("mark_notification_outbox_sent", {
        p_job_id: job.job_id,
        p_provider_message_id: response.data.id,
      });
      if (marked.error) throw marked.error;
      if (!marked.data) throw new Error("The sent outbox job was no longer claimable.");
      sent += 1;
    } catch (error) {
      const code = error instanceof Error ? error.name || "worker_error" : "worker_error";
      const status = await markFailed(job, code, true);
      if (status === "retry") retry += 1;
      else permanentFailure += 1;
    }
  }

  return { claimed: claimed.data.length, permanentFailure, retry, sent };
}
