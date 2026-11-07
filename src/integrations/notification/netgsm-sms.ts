/**
 * Netgsm REST v2 SMS istemcisi. Bağımlılıksızdır: hem Next.js sunucusunda hem
 * Cloudflare queue consumer'ında (workers/app-worker.ts) kullanılır; bu yüzden
 * "server-only" veya "@/" yol takma adı içe aktarmaz.
 *
 * API: POST https://api.netgsm.com.tr/sms/rest/v2/send (Basic auth)
 * Başarılı yanıt `{ "code": "00", "jobid": "…" }` biçimindedir.
 */

export interface NetgsmConfig {
  /** Netgsm abone numarası / kullanıcı kodu */
  usercode: string;
  password: string;
  /** Onaylı SMS başlığı (gönderici adı) */
  msgheader: string;
}

export interface SmsMessage {
  /** 10 haneli, başında 0 olmayan cep numarası (5XXXXXXXXX) */
  to: string;
  text: string;
}

export const NETGSM_SEND_URL = "https://api.netgsm.com.tr/sms/rest/v2/send";

/**
 * Türkiye cep telefonunu Netgsm'in beklediği 10 haneli biçime çevirir.
 * "0507 542 03 01", "+90 507 542 0301", "905075420301" → "5075420301".
 * Cep numarası değilse (sabit hat, eksik hane) null döner.
 */
export function normalizeTrMobile(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("90")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^5\d{9}$/.test(digits) ? digits : null;
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

/** Tek SMS gönderir; Netgsm hata kodu dönerse hata fırlatır (kuyruk yeniden dener). */
export async function sendNetgsmSms(
  config: NetgsmConfig,
  message: SmsMessage,
  fetchImpl: FetchLike = fetch,
): Promise<{ jobId: string | null }> {
  const auth = btoa(`${config.usercode}:${config.password}`);
  const res = await fetchImpl(NETGSM_SEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msgheader: config.msgheader,
      encoding: "TR",
      // Sipariş/kargo bilgilendirmesi ticari ileti değildir (İYS filtresi: bilgilendirme).
      iysfilter: "0",
      messages: [{ msg: message.text, no: message.to }],
    }),
  });

  const body = await res.text();
  let parsed: { code?: string; jobid?: string; description?: string } = {};
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    // Netgsm bazı hatalarda düz metin döner; aşağıda koda göre ele alınır.
  }

  if (!res.ok || parsed.code !== "00") {
    throw new Error(
      `Netgsm SMS başarısız (HTTP ${res.status}, kod ${parsed.code ?? "?"}): ${(parsed.description ?? body).slice(0, 200)}`,
    );
  }
  return { jobId: parsed.jobid ?? null };
}
