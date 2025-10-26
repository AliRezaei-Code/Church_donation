import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DonationStatus } from "@prisma/client";
import SummaryTable from "./summary-table";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function getKpis() {
  const now = new Date();
  const [today, week, month] = await Promise.all([
    prisma.donation.aggregate({
      _sum: { amountCents: true },
      where: {
        status: DonationStatus.SUCCEEDED,
        createdAt: {
          gte: startOfDay(now),
        },
      },
    }),
    prisma.donation.aggregate({
      _sum: { amountCents: true },
      where: {
        status: DonationStatus.SUCCEEDED,
        createdAt: {
          gte: startOfWeek(now),
        },
      },
    }),
    prisma.donation.aggregate({
      _sum: { amountCents: true },
      where: {
        status: DonationStatus.SUCCEEDED,
        createdAt: {
          gte: startOfMonth(now),
        },
      },
    }),
  ]);

  return {
    todayTotal: today._sum.amountCents ?? 0,
    weekTotal: week._sum.amountCents ?? 0,
    monthTotal: month._sum.amountCents ?? 0,
  };
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const kpis = await getKpis();

  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Donations dashboard</h1>
          <p className="text-sm text-slate-600">Monitor totals and export donation data.</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Today" amountCents={kpis.todayTotal} />
        <KpiCard label="This Week" amountCents={kpis.weekTotal} />
        <KpiCard label="This Month" amountCents={kpis.monthTotal} />
      </div>
      <SummaryTable />
    </section>
  );
}

function KpiCard({ label, amountCents }: { label: string; amountCents: number }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">${(amountCents / 100).toFixed(2)}</p>
    </div>
  );
}
