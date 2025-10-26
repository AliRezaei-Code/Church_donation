"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    window.location.href = callbackUrl;
  };

  return (
    <section className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Admin login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to manage donations.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
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
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </section>
  );
}
