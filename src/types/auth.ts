import { UserRole } from '@prisma/client'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      firstName?: string | null
      lastName?: string | null
    } & DefaultSession['user']
  }

  interface User {
    role: UserRole
    firstName?: string | null
    lastName?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    firstName?: string | null
    lastName?: string | null
  }
}