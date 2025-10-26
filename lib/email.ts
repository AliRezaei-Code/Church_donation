import nodemailer from "nodemailer";
import type { Donation } from "@prisma/client";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const emailFrom = process.env.EMAIL_FROM ?? "donotreply@church.org";

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: false,
  auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
});

export async function sendReceiptEmail(donation: Donation) {
  if (!donation.donorEmail) {
    return;
  }

  const amount = (donation.amountCents / 100).toFixed(2);
  const subject = "Thanks for your tithe";
  const text = `Dear donor,\n\nThank you for your gift of $${amount} ${donation.currency} to the ${donation.fund} fund on ${donation.createdAt.toISOString()}.\nYour receipt id is ${donation.id}.\n\nBlessings,\nChurch`; 
  const html = `<p>Dear donor,</p><p>Thank you for your gift of <strong>$${amount} ${donation.currency}</strong> to the <strong>${donation.fund}</strong> fund on ${donation.createdAt.toDateString()}.</p><p>Your receipt id is <strong>${donation.id}</strong>.</p><p>Blessings,<br/>Church</p>`;

  await transporter.sendMail({
    from: emailFrom,
    to: donation.donorEmail,
    subject,
    text,
    html,
  });
}
