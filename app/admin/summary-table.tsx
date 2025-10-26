"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { DonationSummaryResponse } from "./types";

const funds = [
  { value: "", label: "All funds" },
  { value: "General", label: "General" },
  { value: "Missions", label: "Missions" },
];

export default function SummaryTable() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fund, setFund] = useState("");
  const [data, setData] = useState<DonationSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (fund) params.set("fund", fund);

    try {
      const query = params.toString();
      const response = await fetch(`/api/admin/summary${query ? `?${query}` : ''}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load summary");
      }
      const json = (await response.json()) as DonationSummaryResponse;
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Unable to load summary");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (fund) params.set("fund", fund);
    const query = params.toString();
    window.location.href = `/api/admin/export${query ? `?${query}` : ''}`;
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          void load();
        }}
      >
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="from">
            From
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="to">
            To
          </label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor="fund">
            Fund
          </label>
          <select
            id="fund"
            value={fund}
            onChange={(event) => setFund(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          >
            {funds.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? "Loading..." : "Apply filters"}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="w-full rounded-md border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Fund
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Count
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {data?.byFund?.length ? (
              data.byFund.map((row) => (
                <tr key={row.fund}>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.fund}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.count}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {`$${(row.amountCents / 100).toFixed(2)}`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-500">
                  {loading ? "Loading..." : "No donations found for the selected filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && (
        <p className="text-xs text-slate-500">
          Showing data generated on {format(new Date(), "PPpp")}.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
