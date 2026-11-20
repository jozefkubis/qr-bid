import "server-only";

import type { User } from "@clerk/backend";
import { clerkClient } from "@clerk/nextjs/server";

export type VerifiedClerkContact = {
  displayName: string;
  emailAddress: string;
};

export function getClerkDisplayName(user: User) {
  const displayName = user.fullName?.trim();
  if (!displayName) {
    throw new Error("A Clerk full name is required for auction result contact.");
  }
  return displayName;
}

export function getVerifiedClerkEmail(user: User) {
  const email = user.primaryEmailAddress;
  if (!email || email.verification?.status !== "verified") {
    throw new Error("A verified primary Clerk email is required.");
  }
  return email.emailAddress;
}

export async function getVerifiedClerkContact(clerkUserId: string): Promise<VerifiedClerkContact> {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  return {
    displayName: getClerkDisplayName(user),
    emailAddress: getVerifiedClerkEmail(user),
  };
}
