"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterFormData } from "../schemas/auth.schema";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterFormData) {
    setServerError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName } }
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    // Si la sesión ya existe, el proveedor no requiere confirmación de email
    if (authData.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setEmailSent(true);
  }

  if (emailSent) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-slate-700">
          Revisá tu casilla de correo y confirmá tu email para continuar.
        </p>
        <a
          href="/login"
          className="block text-sm text-slate-900 font-medium underline underline-offset-2"
        >
          Volver al login
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
        <input
          {...register("fullName")}
          type="text"
          autoComplete="name"
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
        {errors.fullName && (
          <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          {...register("email")}
          type="email"
          autoComplete="email"
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
        <input
          {...register("password")}
          type="password"
          autoComplete="new-password"
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Confirmar contraseña
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          autoComplete="new-password"
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>
      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          {serverError}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
      </button>
      <p className="text-center text-sm text-slate-500">
        ¿Ya tenés cuenta?{" "}
        <a
          href="/login"
          className="text-slate-900 font-medium underline underline-offset-2 hover:text-slate-600"
        >
          Iniciá sesión
        </a>
      </p>
    </form>
  );
}
