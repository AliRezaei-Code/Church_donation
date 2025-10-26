import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { donationSchema } from "@/lib/validation";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY ?? "";
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = donationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { amountCents, fund, email, recurring } = parsed.data;

    const donation = await prisma.donation.create({
      data: {
        amountCents,
        fund,
        donorEmail: email,
        recurring,
        status: "PENDING",
        processorCheckoutId: "",
      },
    });

    const metadata = {
      donationId: donation.id,
      fund,
    } satisfies Stripe.MetadataParam;

    let session: Stripe.Response<Stripe.Checkout.Session>;

    if (recurring) {
      const price = await findOrCreateMonthlyPrice({ amountCents, fund });
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer_email: email,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/thank-you`,
        cancel_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/`,
        metadata,
        subscription_data: { metadata },
      });
    } else {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: "cad",
              product_data: {
                name: `Tithe – ${fund}`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/thank-you`,
        cancel_url: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/`,
        metadata,
      });
    }

    await prisma.donation.update({
      where: { id: donation.id },
      data: { processorCheckoutId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create checkout session" }, { status: 500 });
  }
}

type PriceLookup = {
  amountCents: number;
  fund: string;
};

async function findOrCreateMonthlyPrice({ amountCents, fund }: PriceLookup) {
  const lookupKey = `${fund}-${amountCents}-monthly`;
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    limit: 1,
  });
  if (prices.data.length > 0) {
    return prices.data[0];
  }

  return stripe.prices.create({
    currency: "cad",
    unit_amount: amountCents,
    nickname: lookupKey,
    lookup_key: lookupKey,
    recurring: { interval: "month" },
    product_data: {
      name: `Tithe – ${fund}`,
    },
  });
}
