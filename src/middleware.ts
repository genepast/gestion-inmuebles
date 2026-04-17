import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
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

  const response = NextResponse.next();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  // 1) Mantener la sesión sincronizada vía cookies (refresh si aplica)
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  // 2) Redirigir no autenticados al intentar entrar al dashboard
  if (!user) {
    if (!isPublicRoute && !isApiRoute) {
      return redirectToLogin(request);
    }
    return response;
  }

  // Si ya está autenticado, no tiene sentido quedarse en /login o /register
  if (isAuthRoute) {
    const target = request.nextUrl.clone();
    target.pathname = "/";
    target.search = "";
    return NextResponse.redirect(target);
  }

  // 3) Sincronización de perfil: asegurar rol 'viewer' por defecto si no existe profile
  let role: AppRole = "viewer";

  try {
    const profileRes = await supabase
      .from<{ role: AppRole }>("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileRes.data?.role === "admin" || profileRes.data?.role === "agent") {
      role = profileRes.data.role;
    } else if (!profileRes.data) {
      // Best-effort: requiere una policy de RLS que permita insertar el propio perfil.
      await supabase.from("profiles").insert({ id: user.id, role: "viewer" });
    }
  } catch {
    // Si todavía no hay RLS/policies, igual protegemos por defecto como viewer.
    role = "viewer";
  }

  // 4) Protección por rol: solo admin/agent pueden crear o editar
  if (isEditOrCreateRoute(pathname) && role === "viewer") {
    const target = request.nextUrl.clone();
    target.pathname = "/properties";
    target.searchParams.set("error", "forbidden");
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

