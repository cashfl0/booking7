import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Clear the session by removing NextAuth cookies and redirect to sign-in
 * Used when we detect invalid session data (e.g., business not found)
 */
export async function clearSessionAndRedirect(errorCode: string, debugInfo?: Record<string, unknown>) {
  console.error('Clearing session due to invalid data:', { errorCode, debugInfo })

  // Clear NextAuth session cookies
  const cookieStore = await cookies()

  // NextAuth uses these cookie names by default
  const sessionCookies = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url'
  ]

  sessionCookies.forEach(cookieName => {
    cookieStore.delete(cookieName)
  })

  // Redirect to sign-in with error code
  redirect(`/auth/signin?error=${errorCode}`)
}