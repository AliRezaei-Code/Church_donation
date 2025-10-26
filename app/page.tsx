"use client";

import { useState } from "react";
import { z } from "zod";
const formSchema = z.object({
  amount: z.number().positive(),
  fund: z.enum(["General", "Missions"]),
  monthly: z.boolean(),
  email: z.string().email(),
});

type FormData = z.infer<typeof formSchema>;

const funds = [
  { value: "General", label: "General" },
  { value: "Missions", label: "Missions" },
];

export default function HomePage() {
  const [form, setForm] = useState<FormData>({
    amount: 25,
    fund: "General",
    monthly: false,
    email: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (field === "monthly") {
      setForm((prev) => ({ ...prev, monthly: (event as React.ChangeEvent<HTMLInputElement>).target.checked }));
    } else if (field === "amount") {
      setForm((prev) => ({ ...prev, amount: Number(event.target.value) }));
    } else {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      setError("Please check your inputs.");
      setLoading(false);
      return;
    }

    const amountCents = Math.round(parsed.data.amount * 100);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amountCents,
          fund: parsed.data.fund,
          email: parsed.data.email,
          recurring: parsed.data.monthly,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to start checkout");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 py-12 md:flex-row">
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Support the mission</h1>
          <p className="mt-2 text-slate-600">
            Give securely through Stripe to support our ministries and missionaries.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="amount">
                Amount (CAD)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min={1}
                step={1}
                value={form.amount}
                onChange={handleChange("amount")}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="fund">
                Fund
              </label>
              <select
                id="fund"
                name="fund"
                value={form.fund}
                onChange={handleChange("fund")}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              >
                {funds.map((fund) => (
                  <option key={fund.value} value={fund.value}>
                    {fund.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="monthly"
                type="checkbox"
                checked={form.monthly}
                onChange={handleChange("monthly")}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="monthly" className="text-sm text-slate-700">
                Make this a monthly gift
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? "Processing..." : "Give securely"}
            </button>
            <p className="text-center text-xs text-slate-500">Powered by Stripe</p>
          </form>
        </div>
      </div>
      <aside className="w-full max-w-sm space-y-4">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Why give?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your generosity fuels discipleship, outreach, and compassion ministries around the world.
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="mt-2 text-sm text-slate-600">
            We use Stripe Checkout so your payment details stay secure and never touch our servers.
          </p>
        </div>
      </aside>
    </div>
  );
}
