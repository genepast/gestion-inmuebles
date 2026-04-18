import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";

type AppRole = "admin" | "agent" | "viewer";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function isEditOrCreateRoute(pathname: string) {
  if (pathname === "/properties/new") return true;
  if (pathname.startsWith("/properties/") && pathname.endsWith("/edit")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isApiRoute = pathname.startsWith("/api/");
  const isPublicRoute =
    isAuthRoute || pathname.startsWith("/_next/") || pathname === "/favicon.ico";

  // Acumulamos las cookies que Supabase necesite escribir (ej. refresh de token)
  // y las aplicamos al response final, sea redirect o next().
  const pendingCookies: CookieToSet[] = [];

  function withCookies(res: NextResponse): NextResponse {
    pendingCookies.forEach(({ name, value, options }) => {
      res.cookies.set(name, value, options);
    });
    return res;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach((c) => pendingCookies.push(c));
      },
    },
  });

  // 1) Validar sesión contra Supabase (más seguro que getSession, valida el JWT)
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  // 2) Redirigir no autenticados al intentar entrar al dashboard
  if (!user) {
    if (!isPublicRoute && !isApiRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return withCookies(NextResponse.redirect(loginUrl));
    }
    return withCookies(NextResponse.next());
  }

  // Si ya está autenticado, no tiene sentido quedarse en /login o /register
  if (isAuthRoute) {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.search = "";
    return withCookies(NextResponse.redirect(target));
  }

  // 3) Leer rol del perfil. La creación del perfil la maneja un trigger de DB en auth.users.
  let role: AppRole = "viewer";

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "admin" || profile?.role === "agent") {
      role = profile.role;
    }
  } catch {
    // Si RLS aún no está configurada, protegemos como viewer por defecto.
  }

  // 4) Protección por rol: solo admin/agent pueden crear o editar
  if (isEditOrCreateRoute(pathname) && role === "viewer") {
    const target = request.nextUrl.clone();
    target.pathname = "/properties";
    target.searchParams.set("error", "forbidden");
    return withCookies(NextResponse.redirect(target));
  }

  return withCookies(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

