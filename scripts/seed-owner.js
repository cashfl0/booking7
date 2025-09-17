import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  try {
    // Delete existing users and businesses to start fresh
    await prisma.business.deleteMany({})
    await prisma.user.deleteMany({})

    console.log('🧹 Cleared existing users and businesses')

    // Create business owner first
    const hashedPassword = await bcrypt.hash('password123', 12)

    const owner = await prisma.user.create({
      data: {
        email: 'owner@funbox.com',
        firstName: 'John',
        lastName: 'Owner',
        passwordHash: hashedPassword,
        role: 'BUSINESS_OWNER',
        emailVerified: new Date()
      }
    })

    // Create business owned by this user
    await prisma.business.create({
      data: {
        name: 'Funbox Indoor',
        slug: 'funbox',
        description: 'Premier indoor bounce park experience',
        email: 'hello@funbox.com',
        phone: '(555) 123-4567',
        address: '123 Fun Street, Bounce City, BC 12345',
        website: 'https://funbox.com',
        timezone: 'America/New_York',
        currency: 'USD',
        isActive: true,
        ownerId: owner.id
      }
    })

    console.log('✅ Created business owner:')
    console.log('   Email: owner@funbox.com')
    console.log('   Password: password123')
    console.log('   Business: Funbox Indoor')
    console.log('')
    console.log('You can now login and access the dashboard at /dashboard')

  } catch (error) {
    console.error('Error seeding business owner:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()