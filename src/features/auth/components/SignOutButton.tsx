"use client";

export function SignOutButton() {
  return (
    <form action="/api/auth/signout" method="POST">
      <button
        type="submit"
        className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
