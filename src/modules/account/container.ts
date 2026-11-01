import { getAuditLogger } from "@/shared/audit";
import { getDb } from "@/shared/db";
import { getEnv } from "@/shared/env";
import { getSiteUrl } from "@/shared/site-url";
import { Argon2PasswordHasher } from "../auth/password-hasher";
import { getNotificationService } from "../notifications/container";
import { D1AccountRepository } from "./account.repository";
import { D1AddressRepository } from "./address.repository";
import { AddressService } from "./address.service";
import { D1PrivacyRepository } from "./privacy.repository";
import { PrivacyService } from "./privacy.service";
import { ProfileService } from "./profile.service";
import { AccountService } from "./account.service";

export function getAccountService(): AccountService {
  return new AccountService({
    accounts: new D1AccountRepository(getDb),
    hasher: new Argon2PasswordHasher(),
    mailer: getNotificationService(),
    secret: getEnv().AUTH_SECRET,
    baseUrl: getSiteUrl(),
  });
}

export function getAddressService(): AddressService {
  return new AddressService(new D1AddressRepository(getDb));
}

export function getProfileService(): ProfileService {
  return new ProfileService(
    new D1AccountRepository(getDb),
    new Argon2PasswordHasher(),
  );
}

export function getPrivacyService(): PrivacyService {
  return new PrivacyService(
    new D1PrivacyRepository(getDb),
    new Argon2PasswordHasher(),
    getAuditLogger(),
  );
}
