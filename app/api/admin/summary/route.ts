import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminSummarySchema } from "@/lib/validation";
import { DonationStatus } from "@prisma/client";

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

  const [today, week, month, byFund] = await Promise.all([
    prisma.donation.aggregate({
      _sum: { amountCents: true },
      where: {
        ...where,
        createdAt: {
          gte: startOfToday(),
        },
      },
    }),
    prisma.donation.aggregate({
      _sum: { amountCents: true },
      where: {
        ...where,
        createdAt: {
          gte: startOfWeek(),
        },
      },
    }),
    prisma.donation.aggregate({
      _sum: { amountCents: true },
      where: {
        ...where,
        createdAt: {
          gte: startOfMonth(),
        },
      },
    }),
    prisma.donation.groupBy({
      by: ["fund"],
      where,
      _sum: { amountCents: true },
      _count: { fund: true },
    }),
  ]);

  return NextResponse.json({
    kpis: {
      todayTotal: today._sum.amountCents ?? 0,
      weekTotal: week._sum.amountCents ?? 0,
      monthTotal: month._sum.amountCents ?? 0,
    },
    byFund: byFund.map((row) => ({
      fund: row.fund,
      count: row._count.fund,
      amountCents: row._sum.amountCents ?? 0,
    })),
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

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  return new Date(now.getFullYear(), now.getMonth(), diff);
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
