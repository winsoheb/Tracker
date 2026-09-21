import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')
  const isOnLoginRoute = req.nextUrl.pathname.startsWith('/login')
  const isOnManagerRoute = req.nextUrl.pathname.startsWith('/manager')

  // Let API Auth routes pass
  if (isOnApiAuthRoute) {
    return
  }

  // If user is on the login page
  if (isOnLoginRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL('/planner', req.nextUrl))
    }
    return
  }

  const isOnApiRoute = req.nextUrl.pathname.startsWith('/api')

  // For all other routes (and non-auth API routes), require authentication
  if (!isLoggedIn) {
    if (isOnApiRoute) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  // RBAC checks
  const role = req.auth?.user?.role
  if (isOnManagerRoute && role !== "MANAGER" && role !== "ADMIN") {
    // If an employee tries to access manager routes, kick them back to their planner
    return Response.redirect(new URL('/planner', req.nextUrl))
  }

  return
})

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
