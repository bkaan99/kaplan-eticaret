"use client";

import { useState, useTransition } from "react";
import {
  accountDangerBtn,
  accountField,
  accountLabel,
  accountPrimaryBtn,
} from "@/components/storefront/account-ui";
import {
  sanitizeTurkishMobileInput,
  TR_MOBILE_INPUT_MAX_DIGITS,
} from "@/shared/phone/tr-mobile";
import {
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
} from "../actions";

function useAction() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successText: string,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      setMessage(
        result.ok
          ? { text: successText, error: false }
          : { text: result.error ?? "İşlem başarısız", error: true },
      );
      if (result.ok) onSuccess?.();
    });
  }

  return { pending, message, run };
}

function Message({
  message,
}: {
  message: { text: string; error: boolean } | null;
}) {
  if (!message) return null;
  return (
    <p
      role={message.error ? "alert" : "status"}
      className={
        message.error
          ? "text-sm font-medium text-brand-pepper"
          : "text-sm font-medium text-brand-leaf"
      }
    >
      {message.text}
    </p>
  );
}

export function ProfileForm({
  firstName,
  lastName,
  phone,
  email,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const [values, setValues] = useState({ firstName, lastName, phone });
  const { pending, message, run } = useAction();

  return (
    <form
      className="flex max-w-md flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => updateProfileAction(values), "Bilgileriniz güncellendi");
      }}
    >
      <label className={accountLabel}>
        E-posta
        <input
          className={accountField}
          value={email}
          disabled
          readOnly
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={accountLabel}>
          Ad
          <input
            className={accountField}
            value={values.firstName}
            onChange={(e) =>
              setValues({ ...values, firstName: e.target.value })
            }
          />
        </label>
        <label className={accountLabel}>
          Soyad
          <input
            className={accountField}
            value={values.lastName}
            onChange={(e) => setValues({ ...values, lastName: e.target.value })}
          />
        </label>
      </div>
      <label className={accountLabel}>
        Cep telefonu
        <input
          className={accountField}
          type="tel"
          inputMode="numeric"
          maxLength={TR_MOBILE_INPUT_MAX_DIGITS}
          placeholder="05XXXXXXXXX"
          value={values.phone}
          onChange={(e) =>
            setValues({
              ...values,
              phone: sanitizeTurkishMobileInput(e.target.value),
            })
          }
        />
      </label>
      <button type="submit" disabled={pending} className={accountPrimaryBtn}>
        Kaydet
      </button>
      <Message message={message} />
    </form>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const { pending, message, run } = useAction();

  return (
    <form
      className="flex max-w-md flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (next !== confirm) return;
        run(
          () => changePasswordAction(current, next),
          "Parolanız değiştirildi",
          () => {
            setCurrent("");
            setNext("");
            setConfirm("");
          },
        );
      }}
    >
      <label className={accountLabel}>
        Mevcut parola
        <input
          type="password"
          autoComplete="current-password"
          className={accountField}
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </label>
      <label className={accountLabel}>
        Yeni parola
        <input
          type="password"
          autoComplete="new-password"
          className={accountField}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </label>
      <label className={accountLabel}>
        Yeni parola (tekrar)
        <input
          type="password"
          autoComplete="new-password"
          className={accountField}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </label>
      {next && confirm && next !== confirm ? (
        <p role="alert" className="text-sm font-medium text-brand-pepper">
          Parolalar eşleşmiyor
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !current || !next || next !== confirm}
        className={accountPrimaryBtn}
      >
        Parolayı değiştir
      </button>
      <Message message={message} />
    </form>
  );
}

export function DeleteAccountForm() {
  const [password, setPassword] = useState("");
  const { pending, message, run } = useAction();

  return (
    <form
      className="flex max-w-md flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (
          !window.confirm(
            "Hesabınız kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?",
          )
        ) {
          return;
        }
        run(() => deleteAccountAction(password), "Hesabınız silindi");
      }}
    >
      <p className="text-sm text-slate-600">
        Hesabınız ve kişisel verileriniz (adresler, favoriler, bildirim
        kayıtları) silinir. Yasal saklama yükümlülüğü gereği sipariş ve fatura
        kayıtları saklanmaya devam eder. Tamamlanmamış siparişiniz varsa hesap
        silinemez.
      </p>
      <label className={accountLabel}>
        Onay için parolanız
        <input
          type="password"
          autoComplete="current-password"
          className={accountField}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={pending || !password}
        className={accountDangerBtn}
      >
        Hesabımı sil
      </button>
      <Message message={message} />
    </form>
  );
}
