import { Injectable } from "@nestjs/common";
import nodemailer, { Transporter } from "nodemailer";

const FROM_ADDRESS = "no-reply@school-app.test";

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

    await this.transporter.sendMail({
      from: FROM_ADDRESS,
      to: email,
      subject: "Reset your password",
      text: `Use the link below to reset your password. This link expires in 15 minutes.\n\n${link}`,
    });
  }
}
