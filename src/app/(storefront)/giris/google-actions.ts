"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { reportError } from "@/shared/error-reporter";
import {
  RATE_LIMIT_POLICIES,
  enforceRateLimit,
  getClientIp,
} from "@/shared/rate-limit";

function safeCallbackUrl(callbackUrl: string): string {
  return callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : "/hesabim";
}

export async function googleSignInAction(callbackUrl: string): Promise<void> {
  const redirectTo = safeCallbackUrl(callbackUrl);

  try {
    const ip = await getClientIp();
    await enforceRateLimit("login:ip", ip, RATE_LIMIT_POLICIES.login);
    await signIn("google", { redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      reportError(error, { action: "googleSignIn" });
      return;
    }
    throw error;
  }
}
