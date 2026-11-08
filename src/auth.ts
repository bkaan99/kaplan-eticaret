import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { getAccountService } from "@/modules/account/container";
import { authService } from "@/modules/auth/container";
import { sessionCookieName } from "@/modules/auth/session-cookie";
import { getEnv } from "@/shared/env";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function splitGoogleName(profile: {
  name?: string | null;
  given_name?: string | null;
  family_name?: string | null;
}): { firstName: string; lastName: string } {
  const given = profile.given_name?.trim();
  const family = profile.family_name?.trim();
  if (given || family) {
    return {
      firstName: given || "Müşteri",
      lastName: family || "-",
    };
  }
  const parts = (profile.name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Müşteri",
    lastName: parts.slice(1).join(" ") || "-",
  };
}

/**
 * Oturum JWT'de yalnızca kullanıcı kimliği ve tipi taşınır. Yetkiler her
 * istekte veritabanından okunur; rol değişikliği ve pasife alma anında etkili olur.
 */
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const env = getEnv();
  // Auth.js'in kanonik adresi tek kaynaktan (APP_URL) alması için.
  process.env["AUTH_URL"] ??= env.APP_URL;

  const providers = [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await authService.authenticate(
          parsed.data.email,
          parsed.data.password,
        );
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          userType: user.type,
        };
      },
    }),
    ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            // Aynı e-posta ile kayıtlı hesabı Google'a bağlamak için.
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ];

  return {
    secret: env.AUTH_SECRET,
    session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
    cookies: {
      sessionToken: {
        name: sessionCookieName(env.NODE_ENV === "production"),
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: env.NODE_ENV === "production",
        },
      },
    },
    pages: { signIn: "/giris" },
    providers,
    callbacks: {
      async jwt({ token, user, account, profile }) {
        if (account?.provider === "google") {
          const email =
            typeof profile?.email === "string"
              ? profile.email
              : typeof user?.email === "string"
                ? user.email
                : null;
          const emailVerified =
            (profile as { email_verified?: boolean } | undefined)
              ?.email_verified !== false;
          if (!email || !emailVerified) {
            return token;
          }

          const names = splitGoogleName(
            (profile ?? {}) as {
              name?: string | null;
              given_name?: string | null;
              family_name?: string | null;
            },
          );
          const linked = await getAccountService().loginWithGoogle({
            email,
            firstName: names.firstName,
            lastName: names.lastName,
          });
          if (!linked) {
            // Pasif hesap vb. — JWT'ye kimlik yazma; session boş kalır.
            return token;
          }
          token.sub = linked.id;
          token.email = linked.email;
          token.name = linked.name;
          token.userType = linked.type;
          return token;
        }

        if (user) {
          token.userType = (user as { userType?: string }).userType;
        }
        return token;
      },
      session({ session, token }) {
        if (token.sub) session.user.id = token.sub;
        session.user.userType = token.userType as string | undefined;
        return session;
      },
    },
  };
});

/** Google OAuth istemci anahtarları tanımlı mı? */
export function isGoogleAuthEnabled(): boolean {
  const env = getEnv();
  return Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);
}
