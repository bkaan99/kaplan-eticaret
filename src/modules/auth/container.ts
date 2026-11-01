import { AuthService } from "./auth.service";
import { D1AuthUserRepository } from "./auth.repository";
import { Argon2PasswordHasher } from "./password-hasher";

/** Auth modülünün bağımlılıklarının bağlandığı tek yer. */
export const authUsers = new D1AuthUserRepository();
export const passwordHasher = new Argon2PasswordHasher();

export const authService = new AuthService({
  users: authUsers,
  hasher: passwordHasher,
});
