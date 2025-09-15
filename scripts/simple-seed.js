const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function simpleSeed() {
  try {
    console.log('🌱 Creating simple seed data...')

    // Get the business
    const business = await prisma.business.findUnique({
      where: { slug: 'funbox' }
    })

    if (!business) {
      console.log('❌ Business not found')
      return
    }

    // Create experience
    console.log('Creating experience...')
    const experience = await prisma.experience.create({
      data: {
        name: 'Bounce Time',
        slug: 'bounce-time',
        description: 'Open bounce sessions for all ages',
        businessId: business.id,
        isActive: true,
        sortOrder: 1
      }
    })

    // Create product
    console.log('Creating product...')
    const product = await prisma.product.create({
      data: {
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

    console.log('✅ Simple seed data created successfully!')
    console.log('- Experience:', experience.name)
    console.log('- Product:', product.name)
    console.log('')
    console.log('Now refresh your dashboard at /dashboard')

  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ Seed data already exists - that\'s okay!')
    } else {
      console.error('❌ Error:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

simpleSeed()