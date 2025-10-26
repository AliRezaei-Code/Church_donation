export default function LegalPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 space-y-8">
      <h1 className="text-3xl font-semibold">Privacy & Terms</h1>
      <article className="space-y-4 text-slate-600">
        <p>
          We respect your privacy and only store the minimum information needed to process your
tithes, including your email address and donation history. We never store payment details.
        </p>
        <p>
          By giving through this site you consent to our use of Stripe for payment processing. If you
have any questions about these terms, please contact the church office.
        </p>
      </article>
    </section>
  );
}
