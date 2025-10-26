import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendReceiptEmail } from "@/lib/email";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (error) {
    console.error("Webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }

    await prisma.webhookEvent.create({
      data: {
        type: event.type,
        rawJson: event.data.object as unknown as object,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler failed", error);
    return NextResponse.json({ error: "Webhook handler failure" }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const donation = await prisma.donation.findFirst({
    where: { processorCheckoutId: session.id },
  });

  if (!donation) {
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

  const updated = await prisma.donation.update({
    where: { id: donation.id },
    data: {
      status: "SUCCEEDED",
      processorPaymentIntentId: paymentIntentId ?? subscriptionId ?? donation.processorPaymentIntentId,
      recurring: session.mode === "subscription" ? true : donation.recurring,
    },
  });

  if (!updated.receiptEmailSent) {
    await sendReceiptEmailSafe(updated.id);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const amountCents = invoice.amount_paid ?? invoice.amount_due ?? invoice.total ?? 0;
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

  const baseDonation = subscriptionId
    ? await prisma.donation.findFirst({ where: { processorPaymentIntentId: subscriptionId } })
    : null;

  const fund = invoice.metadata?.fund ?? baseDonation?.fund ?? "General";
  const donorEmail = invoice.customer_email ?? baseDonation?.donorEmail ?? "";

  const donation = await prisma.donation.create({
    data: {
      amountCents,
      fund,
      donorEmail,
      recurring: true,
      processor: "stripe",
      processorCheckoutId: invoice.id,
      processorPaymentIntentId:
        (typeof invoice.payment_intent === "string"
          ? invoice.payment_intent
          : invoice.payment_intent?.id) ?? undefined,
      status: "SUCCEEDED",
    },
  });

  await sendReceiptEmailSafe(donation.id);
}

async function sendReceiptEmailSafe(donationId: string) {
  const donation = await prisma.donation.findUnique({ where: { id: donationId } });
  if (!donation || donation.receiptEmailSent) {
    return;
  }

  try {
    await sendReceiptEmail(donation);
    await prisma.donation.update({
      where: { id: donation.id },
      data: { receiptEmailSent: true },
    });
  } catch (error) {
    console.error('Failed to send receipt email', error);
  }
}
