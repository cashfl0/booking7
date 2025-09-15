const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    // Check if business owner already exists
    const existingOwner = await prisma.user.findFirst({
      where: { role: 'BUSINESS_OWNER' }
    })

    if (existingOwner) {
      console.log('Business owner already exists:', existingOwner.email)
      return
    }

    // Create business first
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
        isActive: true
      }
    })

    // Create business owner
    const hashedPassword = await bcrypt.hash('password123', 12)

    const businessOwner = await prisma.user.create({
      data: {
        email: 'owner@funbox.com',
        name: 'John Owner',
        password: hashedPassword,
        role: 'BUSINESS_OWNER',
        businessId: business.id,
        emailVerified: new Date()
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