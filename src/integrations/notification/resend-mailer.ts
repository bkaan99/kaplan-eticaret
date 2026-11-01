import type { EmailMessage, Mailer } from "./mailer";

export interface ResendConfig {
  apiKey: string;
  from: string;
}

/**
 * Resend HTTP API — Workers’ta nodemailer/SMTP yerine kullanılır.
 * https://resend.com/docs/api-reference/emails/send-email
 */
export class ResendMailer implements Mailer {
  constructor(private readonly config: ResendConfig) {}

  async send(message: EmailMessage): Promise<void> {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: this.config.from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend ${res.status}: ${body.slice(0, 500)}`);
    }
  }
}
