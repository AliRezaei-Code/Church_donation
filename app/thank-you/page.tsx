export default function ThankYouPage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
        ✓
      </div>
      <h1 className="text-3xl font-semibold">Thank you for your generosity!</h1>
      <p className="text-slate-600">
        A receipt has been emailed to you. Your support helps sustain our ministry.
      </p>
      <a
        href="/"
        className="mt-6 rounded-md border border-indigo-600 px-4 py-2 text-indigo-600 transition hover:bg-indigo-50"
      >
        Give again
      </a>
    </section>
  );
}
