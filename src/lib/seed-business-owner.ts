import { prisma } from './prisma'
import { hash } from 'bcryptjs'

export async function seedBusinessOwner() {
  try {
    // Check if business owner already exists
    const existingOwner = await prisma.user.findFirst({
      where: { role: 'BUSINESS_OWNER' }
    })

    if (existingOwner) {
      console.log('Business owner already exists:', existingOwner.email)
      return existingOwner
    }

    // Create business owner first
    const hashedPassword = await hash('password123', 12)

    const businessOwner = await prisma.user.create({
      data: {
        email: 'owner@funbox.com',
        firstName: 'John',
        lastName: 'Owner',
        role: 'BUSINESS_OWNER',
        passwordHash: hashedPassword,
        emailVerified: new Date()
      }
    })

    // Create business with owner
    const business = await prisma.business.create({
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
        ownerId: businessOwner.id
      }
    })

    console.log('Created business owner:', businessOwner.email)
    console.log('Password: password123')
    console.log('Business:', business.name)

    return businessOwner
  } catch (error) {
    console.error('Error seeding business owner:', error)
    throw error
  }
}