import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminSummarySchema } from "@/lib/validation";
import { DonationStatus } from "@prisma/client";
import { stringify } from "csv-stringify/sync";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = adminSummarySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  const where = buildWhere(parsed.data);

  const donations = await prisma.donation.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const csv = stringify(
    donations.map((donation) => [
      donation.createdAt.toISOString(),
      (donation.amountCents / 100).toFixed(2),
      donation.currency,
      donation.fund,
      donation.donorEmail,
      donation.status,
      donation.recurring ? "true" : "false",
      donation.processorPaymentIntentId ?? "",
    ]),
    {
      header: true,
      columns: [
        "created_at",
        "amount",
        "currency",
        "fund",
        "donor_email",
        "status",
        "recurring",
        "processor_payment_intent_id",
      ],
    }
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=donations.csv",
    },
  });
}

function buildWhere(filters: { from?: string; to?: string; fund?: string }) {
  const createdAt: { gte?: Date; lte?: Date } = {};
  if (filters.from) {
    createdAt.gte = new Date(filters.from);
  }
  if (filters.to) {
    createdAt.lte = new Date(filters.to);
  }

  return {
    status: DonationStatus.SUCCEEDED,
    ...(filters.fund ? { fund: filters.fund } : {}),
    ...(Object.keys(createdAt).length ? { createdAt } : {}),
  };
}
