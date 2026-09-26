"use client";
import { useAuth } from "./AuthProvider";

export default function SessionChip() {
  const { user, ready, signOut } = useAuth();
  if (!ready) return null;
  if (!user) {
    return (
      <a href="/login" className="btn-ghost !py-1.5 text-xs">
        Log in / Sign up
      </a>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs text-muted">
      <span className="max-w-40 truncate">{user.email}</span>
      <button onClick={signOut} className="underline">
        Sign out
      </button>
    </span>
  );
}
