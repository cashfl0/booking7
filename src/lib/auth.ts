import { NextAuthOptions, User } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

interface CustomUser extends User {
  role: UserRole
  businessId?: string
}

export const authOptions: NextAuthOptions = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            Business: true
          }
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!passwordMatch) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email,
          role: user.role,
          businessId: user.Business?.[0]?.id || null,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log('JWT callback - user:', user)
      console.log('JWT callback - token before:', token)

      if (user) {
        const customUser = user as CustomUser
        token.role = customUser.role
        token.businessId = customUser.businessId
      }

      console.log('JWT callback - token after:', token)
      return token
    },
    async session({ session, token }) {
      console.log('Session callback - token:', token)
      console.log('Session callback - session before:', session)

      if (session?.user && token?.sub) {
        session.user.id = token.sub
        Object.assign(session.user, {
          role: token.role,
          businessId: token.businessId
        })
      }

      console.log('Session callback - session after:', session)
      return session
    },
    async signIn() {
      return true
    },
    async redirect({ url, baseUrl }) {
      // If user is signing in, check their role and redirect accordingly
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default redirect to base URL
      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
}