import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks/dodo (public webhook endpoint for Dodo Payments)
     *   We must NOT run auth middleware on webhooks to avoid 307 -> /login.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks/dodo|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
