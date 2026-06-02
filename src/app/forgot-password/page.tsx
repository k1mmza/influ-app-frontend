import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto max-w-md rounded-3xl bg-card p-8 shadow-sm ring-1 ring-border">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Account recovery</p>
      <h1 className="mt-2 text-3xl font-bold text-foreground font-serif">Forgot password?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we will send a password reset link. For security, links expire in 15 minutes.
      </p>

      <form className="mt-6 space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-foreground">Email</span>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border px-3 py-2.5 outline-none ring-primary transition focus:ring-2"
          />
        </label>
        <button type="button" className="w-full rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition hover:opacity-90">
          Send reset link
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Back to login
        </Link>
      </p>
    </section>
  );
}
