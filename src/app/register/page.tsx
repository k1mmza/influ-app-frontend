import Link from "next/link";

export default function RegisterPage() {
  return (
    <section className="mx-auto min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
      <div className="grid min-h-[calc(100vh-3rem)] md:grid-cols-[1fr_1.05fr]">
        <aside className="relative hidden flex-col justify-between bg-gradient-to-b from-indigo-700 via-indigo-700 to-violet-700 px-10 py-8 text-white md:flex">
          <div className="inline-flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-sm text-white">
              IA
            </span>
            InfluApp
          </div>

          <div className="max-w-sm">
            <h2 className="text-5xl font-bold leading-tight">Build your creator growth engine.</h2>
            <p className="mt-6 text-lg text-indigo-100">
              "Launch faster, match smarter, and scale your partnerships with trusted creator insights."
            </p>
            <div className="mt-8 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-sm font-semibold">AM</span>
              <div>
                <p className="font-semibold">Alya Morgan</p>
                <p className="text-sm text-indigo-100">Partnership Lead, Nexa Commerce</p>
              </div>
            </div>
          </div>

          <div className="flex gap-10">
            <div>
              <p className="text-3xl font-bold">15K+</p>
              <p className="text-sm text-indigo-100">Active Campaigns</p>
            </div>
            <div>
              <p className="text-3xl font-bold">2.4M</p>
              <p className="text-sm text-indigo-100">Creators Indexed</p>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center bg-white px-6 py-10 md:px-12">
          <div className="w-full max-w-xl">
            <h1 className="text-4xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-2 text-slate-600">Join InfluApp and start connecting with the right creators.</p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-6.9 0-.7-.1-1.5-.2-2.2H12z" />
                  <path fill="#34A853" d="M12 22c2.6 0 4.8-.9 6.4-2.5l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4H3.4v2.5A10 10 0 0 0 12 22z" />
                  <path fill="#4A90E2" d="M6.6 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.5H3.4A10 10 0 0 0 2.4 12c0 1.6.4 3.1 1 4.5L6.6 14z" />
                  <path fill="#FBBC05" d="M12 6c1.4 0 2.6.5 3.5 1.4l2.6-2.6A10 10 0 0 0 3.4 7.5L6.6 10c.8-2.3 2.9-4 5.4-4z" />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="currentColor" d="M17.6 12.7c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-1.9-1.5-.1-3 .9-3.8.9s-2-.9-3.3-.9c-1.7 0-3.2 1-4.1 2.4-1.8 3.1-.5 7.7 1.3 10.3.9 1.3 1.9 2.8 3.3 2.8 1.4-.1 1.9-.8 3.6-.8s2.1.8 3.6.8c1.5 0 2.4-1.3 3.3-2.6 1-1.5 1.4-2.9 1.4-3-.1-.1-2.7-1-2.8-4.3zM15.1 5.6c.7-.9 1.2-2.1 1.1-3.3-1 .1-2.2.7-2.9 1.6-.7.8-1.3 2-1.2 3.2 1.1.1 2.3-.6 3-1.5z" />
                </svg>
                Apple
              </button>
            </div>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">Or continue with email</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-slate-700">Account type</legend>
                <p className="text-xs text-slate-500">Choose the role that best matches how you will use InfluApp.</p>
                <div className="grid grid-cols-3 items-stretch gap-2">
                  <label className="h-full cursor-pointer">
                    <input type="radio" name="accountType" value="agency" required defaultChecked className="peer sr-only" />
                    <span className="flex h-full min-h-40 flex-col items-center rounded-xl border border-slate-300 bg-slate-50 px-2 py-4 text-center transition hover:border-primary/50 hover:bg-indigo-50 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-checked:border-primary peer-checked:bg-indigo-50">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 peer-checked:bg-primary peer-checked:text-white">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                          <path fill="currentColor" d="M4 20h16a1 1 0 0 0 1-1v-8.5a1 1 0 0 0-.3-.7l-3.5-3.5a1 1 0 0 0-.7-.3H4a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1zm2-2v-3h3v3H6zm5 0v-5h3v5h-3zm5 0v-7h3v7h-3z" />
                        </svg>
                      </span>
                      <span className="mt-3 block text-base font-bold text-slate-900">Agency</span>
                      <span className="mt-1 block min-h-10 text-xs leading-5 text-slate-600">Manage multiple top-tier talents.</span>
                    </span>
                  </label>

                  <label className="h-full cursor-pointer">
                    <input type="radio" name="accountType" value="brand" className="peer sr-only" />
                    <span className="flex h-full min-h-40 flex-col items-center rounded-xl border border-slate-300 bg-slate-50 px-2 py-4 text-center transition hover:border-primary/50 hover:bg-indigo-50 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-checked:border-primary peer-checked:bg-indigo-50">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 peer-checked:bg-primary peer-checked:text-white">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                          <path fill="currentColor" d="M7 4h10l1 4v12H6V8l1-4zm2 2-.5 2h7L15 6H9z" />
                        </svg>
                      </span>
                      <span className="mt-3 block text-base font-bold text-slate-900">Brand</span>
                      <span className="mt-1 block min-h-10 text-xs leading-5 text-slate-600">Looking for the perfect creator match.</span>
                    </span>
                  </label>

                  <label className="h-full cursor-pointer">
                    <input type="radio" name="accountType" value="influencer" className="peer sr-only" />
                    <span className="flex h-full min-h-40 flex-col items-center rounded-xl border border-slate-300 bg-slate-50 px-2 py-4 text-center transition hover:border-primary/50 hover:bg-indigo-50 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-checked:border-primary peer-checked:bg-indigo-50">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-600 peer-checked:bg-primary peer-checked:text-white">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                          <path fill="currentColor" d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-7 14a7 7 0 0 1 14 0v2H5v-2zm14.5-6.8 1.4 1.4-1.4 1.4-1.4-1.4 1.4-1.4zM3.1 12.6l1.4-1.4 1.4 1.4-1.4 1.4-1.4-1.4z" />
                        </svg>
                      </span>
                      <span className="mt-3 block text-base font-bold text-slate-900">Influencer</span>
                      <span className="mt-1 block min-h-10 text-xs leading-5 text-slate-600">Sharing stories and building communities.</span>
                    </span>
                  </label>
                </div>
              </fieldset>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Full name</span>
                <input
                  type="text"
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-indigo-500 transition focus:ring-2"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Email Address</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-indigo-500 transition focus:ring-2"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-indigo-500 transition focus:ring-2"
                />
              </label>

              <label className="inline-flex items-start gap-2 text-sm text-slate-600">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                I agree to the Terms of Service and Privacy Policy.
              </label>

              <button
                type="button"
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Create Account
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
                Log in
              </Link>
            </p>

            <div className="mt-12 flex justify-center gap-5 text-xs text-slate-400">
              <Link href="#" className="hover:text-slate-600">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-slate-600">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-slate-600">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
