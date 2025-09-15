import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { UserRole } from '@prisma/client'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }
  return user
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth()
  if (user.role !== role) {
    redirect('/unauthorized')
  }
  return user
}

export async function requireBusinessOwner() {
  return requireRole(UserRole.BUSINESS_OWNER)
}

export async function requireAdmin() {
  return requireRole(UserRole.ADMIN)
}