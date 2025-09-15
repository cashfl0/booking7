const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedDashboardData() {
  try {
    console.log('🌱 Seeding dashboard data...')

    // Get the business
    const business = await prisma.business.findUnique({
      where: { slug: 'funbox' }
    })

    if (!business) {
      console.log('❌ Business not found')
      return
    }

    // Create experience
    const experience = await prisma.experience.upsert({
      where: {
        businessId_slug: {
          businessId: business.id,
          slug: 'bounce-time'
        }
      },
      update: {},
      create: {
        name: 'Bounce Time',
        slug: 'bounce-time',
        description: 'Open bounce sessions for all ages',
        businessId: business.id,
        isActive: true,
        sortOrder: 1
      }
    })

    // Create product
    const product = await prisma.product.upsert({
      where: {
        experienceId_slug: {
          experienceId: experience.id,
          slug: 'access-pass-90min'
        }
      },
      update: {},
      create: {
        name: 'Funbox Access Pass (90-min)',
        slug: 'access-pass-90min',
        description: '90 minutes of unlimited bouncing fun',
        experienceId: experience.id,
        basePrice: 25.00,
        duration: 90,
        isActive: true,
        sortOrder: 1
      }
    })

    // Create ticket types
    await prisma.ticketType.upsert({
      where: {
        productId_slug: {
          productId: product.id,
          slug: 'adult'
        }
      },
      update: {},
      create: {
        name: 'Adult (13+)',
        slug: 'adult',
        productId: product.id,
        price: 25.00,
        minAge: 13,
        maxAge: null,
        isActive: true,
        sortOrder: 1
      }
    })

    await prisma.ticketType.upsert({
      where: {
        productId_slug: {
          productId: product.id,
          slug: 'child'
        }
      },
      update: {},
      create: {
        name: 'Child (3-12)',
        slug: 'child',
        productId: product.id,
        price: 20.00,
        minAge: 3,
        maxAge: 12,
        isActive: true,
        sortOrder: 2
      }
    })

    // Create today's session
    const today = new Date()
    const sessionStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0) // 2 PM today
    const sessionEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30, 0) // 3:30 PM today

    await prisma.session_Product.upsert({
      where: {
        productId_startTime: {
          productId: product.id,
          startTime: sessionStart
        }
      },
      update: {},
      create: {
        productId: product.id,
        startTime: sessionStart,
        endTime: sessionEnd,
        capacity: 50,
        price: 25.00,
        isActive: true
      }
    })

    console.log('✅ Dashboard seed data created successfully!')
    console.log('- Business: Funbox Indoor')
    console.log('- Experience: Bounce Time')
    console.log('- Product: Funbox Access Pass (90-min)')
    console.log('- Ticket Types: Adult, Child')
    console.log('- Session: Today 2:00 PM - 3:30 PM')

  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDashboardData()