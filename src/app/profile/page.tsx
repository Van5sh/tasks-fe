"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState, useSyncExternalStore } from "react";
import type { User } from "../../interfaces/user";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const token = isClient ? localStorage.getItem("token") : null;

  const apiFetch = async <T,>(path: string): Promise<T> => {
    const headers = new Headers();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const res = await fetch(path, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data?.detail ?? "Request failed";
      throw new Error(detail);
    }
    return data as T;
  };

  const loadProfilePage = useEffectEvent(async () => {
    try {
      const me = await apiFetch<User>("/api/v1/users/me");
      setUser(me);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  });

  useEffect(() => {
    if (!isClient || !token) return;
    void loadProfilePage();
  }, [isClient, token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_profile");
    setUser(null);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fafc_0%,_#fdf2e9_45%,_#eef2ff_100%)]">
        <div className="bg-grid min-h-screen">
          <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12">
            <section className="glass w-full rounded-3xl border border-white/60 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Profile
              </p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[var(--ink)]">
                Loading profile
              </h1>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fafc_0%,_#fdf2e9_45%,_#eef2ff_100%)]">
        <div className="bg-grid min-h-screen">
          <div className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-12">
            <section className="glass w-full rounded-3xl border border-white/60 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Profile
              </p>
              <h1 className="mt-2 font-[var(--font-display)] text-3xl text-[var(--ink)]">
                Session required
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Log in from the main page to view your profile.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Go to dashboard
              </Link>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,_#f8fafc_0%,_#fdf2e9_45%,_#eef2ff_100%)]">
      <div className="bg-grid min-h-screen">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
          <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Profile
              </p>
              <h1 className="font-[var(--font-display)] text-4xl leading-tight text-[var(--ink)] md:text-5xl">
                {user?.username ?? "Profile"}
              </h1>
              <p className="mt-2 text-base text-[var(--muted)]">
                Backend profile details and session controls.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400"
              >
                Back to dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          </header>

          <section className="glass rounded-3xl border border-white/60 p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">
              User Details
            </h2>
            <div className="mt-6 space-y-3 text-sm text-zinc-700">
              <ProfileRow label="Username" value={user?.username ?? "Not available"} />
              <ProfileRow label="Email" value={user?.email ?? "Not available"} />
              <ProfileRow label="Date of birth" value={user?.dob ?? "Not available"} />
              <ProfileRow label="Gender" value={user?.gender ?? "Not available"} />
            </div>
            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white/70 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-[var(--ink)]">{value}</p>
    </div>
  );
}
