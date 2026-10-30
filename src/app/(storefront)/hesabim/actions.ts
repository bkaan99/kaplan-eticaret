"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getAddressService,
  getPrivacyService,
  getProfileService,
} from "@/modules/account/container";
import { requireUser } from "@/modules/auth/session";
import { runStorefrontAction } from "@/shared/action";
import {
  RATE_LIMIT_POLICIES,
  enforceRateLimit,
  getClientIp,
} from "@/shared/rate-limit";

export interface AccountActionResult {
  ok: boolean;
  error?: string;
}

async function run(
  handler: () => Promise<void>,
  revalidate: string[] = [],
): Promise<AccountActionResult> {
  return runStorefrontAction(handler, {
    actionName: "account",
    revalidate,
  });
}

export async function saveAddressAction(
  id: string | null,
  payload: unknown,
): Promise<AccountActionResult> {
  return run(async () => {
    const user = await requireUser();
    await getAddressService().save(user.id, id, payload);
  }, ["/hesabim/adresler", "/odeme"]);
}

export async function deleteAddressAction(
  id: string,
): Promise<AccountActionResult> {
  return run(async () => {
    const user = await requireUser();
    await getAddressService().remove(user.id, id);
  }, ["/hesabim/adresler", "/odeme"]);
}

export async function updateProfileAction(
  payload: unknown,
): Promise<AccountActionResult> {
  return run(async () => {
    const user = await requireUser();
    await getProfileService().updateProfile(user.id, payload);
  }, ["/hesabim", "/hesabim/ayarlar"]);
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<AccountActionResult> {
  return run(async () => {
    const user = await requireUser();
    const ip = await getClientIp();
    await enforceRateLimit(
      "password-change",
      `${user.id}:${ip}`,
      RATE_LIMIT_POLICIES.login,
    );
    await getProfileService().changePassword(
      user.id,
      currentPassword,
      newPassword,
    );
  });
}

export async function deleteAccountAction(
  password: string,
): Promise<AccountActionResult> {
  const result = await run(async () => {
    const user = await requireUser();
    const ip = await getClientIp();
    await enforceRateLimit(
      "account-delete",
      `${user.id}:${ip}`,
      RATE_LIMIT_POLICIES.login,
    );
    await getPrivacyService().deleteAccount(user.id, password);
  });

  if (result.ok) redirect("/api/auth/signout?callbackUrl=/");
  return result;
}
