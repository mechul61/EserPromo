"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout/", { method: "POST" });
    router.refresh();
    router.push("/");
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-md border border-line px-4 py-2 text-[13px] font-semibold text-navy hover:bg-soft"
    >
      Çıkış Yap
    </button>
  );
}
