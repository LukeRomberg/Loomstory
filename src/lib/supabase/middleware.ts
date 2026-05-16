import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Mutable headers we will forward to downstream Server Components.
  const requestHeaders = new Headers(request.headers);
  // Strip any caller-supplied user headers so they can't be spoofed.
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-email");

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Define public routes that don't require auth
  const publicRoutes = ["/login", "/register", "/forgot-password", "/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && isPublicRoute && !request.nextUrl.pathname.startsWith("/auth/callback")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Expose verified user to downstream Server Components via request headers.
  // Rebuild the response so the headers snapshot captures the new values.
  if (user) {
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-email", user.email ?? "");
    const finalResponse = NextResponse.next({
      request: { headers: requestHeaders },
    });
    // Carry over any cookies Supabase may have refreshed during getUser().
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie);
    });
    return finalResponse;
  }

  return supabaseResponse;
}
