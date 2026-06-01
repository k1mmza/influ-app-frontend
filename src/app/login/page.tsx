"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/lib/types";
import { useUserStore } from "@/store/useUserStore";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useUserStore();
  const [selectedRole, setSelectedRole] = useState<Role>("influencer");

  const handleSignIn = () => {
    signIn(selectedRole);
    router.push(selectedRole === "influencer" ? "/dashboard" : "/dashboard");
  };

  return (
    <section className="mx-auto min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-200">
      <div className="grid min-h-[calc(100vh-3rem)] md:grid-cols-[1fr_1.05fr]">
        <aside className="relative hidden flex-col justify-between bg-gradient-to-b from-indigo-700 via-indigo-700 to-violet-700 px-10 py-8 text-white md:flex">
          <div>
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold transition hover:opacity-80">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-sm text-white">
              IA
            </span>
            InfluApp
          </Link>
          </div>

          <div className="max-w-sm">
            <h2 className="text-5xl font-bold leading-tight">Master the pulse of the creator economy.</h2>
            <p className="mt-6 text-lg text-indigo-100">
              "Precision analytics is no longer a luxury; it&apos;s the engine that drives influence into measurable impact."
            </p>
            <div className="mt-8 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-sm font-semibold">SC</span>
              <div>
                <p className="font-semibold">Sarah Chen</p>
                <p className="text-sm text-indigo-100">Head of Growth, Global Brands Inc.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-10">
            <div>
              <p className="text-3xl font-bold">98%</p>
              <p className="text-sm text-indigo-100">ROI Accuracy</p>
            </div>
            <div>
              <p className="text-3xl font-bold">2.4M</p>
              <p className="text-sm text-indigo-100">Creators Indexed</p>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center bg-white px-6 py-10 md:px-12">
          <div className="w-full max-w-md">
            <h1 className="text-4xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-2 text-slate-600">Sign in to your account to manage campaigns</p>

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
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Email Address</span>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-indigo-500 transition focus:ring-2"
                />
              </label>

              <label className="block space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Password</span>
                  <Link href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="********"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-indigo-500 transition focus:ring-2"
                />
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                Remember me for 30 days
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Role</span>
                <select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as Role)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-indigo-500 transition focus:ring-2"
                >
                  <option value="agency">Agency</option>
                  <option value="brand">Brand</option>
                  <option value="influencer">Influencer</option>
                </select>
              </label>

              <button
                type="button"
                onClick={handleSignIn}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
              >
                Sign In
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-indigo-600 hover:underline">
                Sign up
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
