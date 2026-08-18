import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { Transporter } from "nodemailer";

const FROM_ADDRESS = "no-reply@school-app.test";

// Tracks sendMail calls that are currently in flight. Callers that dispatch
// a send without awaiting it (so response latency never depends on SMTP
// delivery) can still be sure it has actually finished by awaiting
// settleMail() below, instead of racing whatever reads the mailbox next.
const pendingSends = new Set<Promise<unknown>>();

/**
 * Resolves once every send that was in flight at the moment of the call has
 * settled (delivered or failed). Not used by request-handling code — the
 * whole point of not awaiting a send there is that the HTTP response must
 * not wait on SMTP. This exists so test setup can safely reset the mailbox
 * between cases without racing a still-in-flight delivery from a previous
 * one.
 */
export async function settleMail(): Promise<void> {
  await Promise.allSettled([...pendingSends]);
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly deliverable: boolean;

  constructor() {
    const host = process.env.SMTP_HOST;
    this.deliverable = Boolean(host);

    // With no SMTP server configured — the normal state of a free deployment,
    // where there is no Maildev — nodemailer would otherwise be handed host
    // `undefined` on port `NaN` and reject every send, turning the documented
    // 202 from POST /auth/forgot-password into a 500. jsonTransport serialises
    // the message and resolves instead, and sendPasswordReset logs the link
    // below so it stays usable.
    this.transporter = this.deliverable
      ? nodemailer.createTransport({
          host,
          port: Number(process.env.SMTP_PORT),
          secure: false,
          // Providers that need credentials read them from the environment;
          // Maildev accepts anonymous mail and sets neither.
          ...(process.env.SMTP_USER
            ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
            : {}),
        })
      : nodemailer.createTransport({ jsonTransport: true });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const link = `${process.env.APP_URL}/reset-password?token=${token}`;

    if (!this.deliverable) {
      this.logger.warn(
        `SMTP_HOST is not set, so no mail was delivered. Password reset link for ${email}: ${link}`,
      );
    }

    const send = this.transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: "Reset your password",
      text: `Use the link below to reset your password. This link expires in 15 minutes.\n\n${link}`,
    });

    pendingSends.add(send);
    try {
      await send;
    } finally {
      pendingSends.delete(send);
    }
  }
}
