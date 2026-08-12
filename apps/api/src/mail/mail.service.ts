import { Injectable } from "@nestjs/common";
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
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const link = `${process.env.APP_URL}/reset-password?token=${token}`;

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
