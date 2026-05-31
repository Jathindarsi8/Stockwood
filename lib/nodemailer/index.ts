import nodemailer from "nodemailer";

if (!process.env.SMTP_HOST) throw new Error("SMTP_HOST is not set");
if (!process.env.SMTP_PORT) throw new Error("SMTP_PORT is not set");
if (!process.env.SMTP_USER) throw new Error("SMTP_USER is not set");
if (!process.env.SMTP_PASS) throw new Error("SMTP_PASS is not set");
if (!process.env.EMAIL_FROM) throw new Error("EMAIL_FROM is not set");

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // false = STARTTLS on port 587 (Gmail). Use true for port 465.
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
};

export const sendEmail = async ({ to, subject, html }: SendEmailArgs) => {
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });

  console.log(`📧 Email sent to ${to} — messageId: ${info.messageId}`);
  return info;
};