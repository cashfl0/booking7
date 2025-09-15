import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@funbox.com' },
    update: {},
    create: {
      email: 'admin@funbox.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
      emailVerified: new Date(),
    },
  })

  // Create business owner
  const ownerPassword = await bcrypt.hash('owner123', 12)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@funbox.com' },
    update: {},
    create: {
      email: 'owner@funbox.com',
      firstName: 'Business',
      lastName: 'Owner',
      role: UserRole.BUSINESS_OWNER,
      passwordHash: ownerPassword,
      emailVerified: new Date(),
    },
  })

  // Create Funbox business
  const funbox = await prisma.business.upsert({
    where: { slug: 'funbox' },
    update: {},
    create: {
      name: 'Funbox',
      slug: 'funbox',
      description: 'Houston\'s biggest bounce park!',
      email: 'info@funbox.com',
      phone: '+1-555-123-4567',
      address: '123 Bounce Street, Houston, TX 77001',
      website: 'https://funbox.com',
      logoUrl: '/funbox-logo.png',
      primaryColor: '#ff6b9d',
      timezone: 'America/Chicago',
      currency: 'USD',
      ownerId: owner.id,
    },
  })

  // Create bounce park experience
  const bounceExperience = await prisma.experience.upsert({
    where: {
      businessId_slug: {
        businessId: funbox.id,
        slug: 'bounce-park'
      }
    },
    update: {},
    create: {
      name: 'Bounce Park',
      slug: 'bounce-park',
      description: 'Ultimate bouncing experience with climbing and sliding',
      imageUrl: '/bounce-park.jpg',
      businessId: funbox.id,
    },
  })

  // Create Access Pass product
  const accessPass = await prisma.product.upsert({
    where: {
      experienceId_slug: {
        experienceId: bounceExperience.id,
        slug: 'access-pass-90min'
      }
    },
    update: {},
    create: {
      name: 'Funbox Access Pass (90-Min)',
      slug: 'access-pass-90min',
      description: '90 minutes of bouncing, climbing, & sliding at Houston\'s biggest bounce park! Plus, an arcade for all ages and toddler soft play!',
      imageUrl: '/access-pass.jpg',
      basePrice: 19.00,
      duration: 90,
      maxCapacity: 50,
      experienceId: bounceExperience.id,
    },
  })

  // Create Family Fun Pack product
  const familyPack = await prisma.product.upsert({
    where: {
      experienceId_slug: {
        experienceId: bounceExperience.id,
        slug: 'family-fun-pack'
      }
    },
    update: {},
    create: {
      name: 'Family Fun Pack: 4+ Guests [Save 15%]',
      slug: 'family-fun-pack',
      description: 'Have a family of four or more?! Save $ AND bounce, play, & make unforgettable memories together!',
      imageUrl: '/family-pack.jpg',
      basePrice: 64.60, // 4 * 19 * 0.85
      duration: 90,
      maxCapacity: 20,
      experienceId: bounceExperience.id,
    },
  })

  // Create Birthday Tour product
  const birthdayTour = await prisma.product.upsert({
    where: {
      experienceId_slug: {
        experienceId: bounceExperience.id,
        slug: 'birthday-tour'
      }
    },
    update: {},
    create: {
      name: 'Free Birthday Tour: Check Out the Best Party Rooms in Houston! 🎂',
      slug: 'birthday-tour',
      description: 'Take a free tour of Funbox 🎉 See our birthday rooms & learn about packages before you book!',
      imageUrl: '/birthday-tour.jpg',
      basePrice: 0.00,
      duration: 30,
      maxCapacity: 10,
      experienceId: bounceExperience.id,
    },
  })

  // Create ticket types for Access Pass
  await prisma.ticketType.createMany({
    data: [
      {
        name: 'Bounce Pass (ages 6 & over)',
        price: 19.00,
        minAge: 6,
        productId: accessPass.id,
        sortOrder: 1,
      },
      {
        name: 'Ages 3-5 (with purchase of Bounce Pass)',
        price: 14.00,
        minAge: 3,
        maxAge: 5,
        requiresTicketTypeId: null, // We'll update this after creating the first ticket type
        productId: accessPass.id,
        sortOrder: 2,
      },
      {
        name: 'Under 3 (free with purchase of Bounce Pass)',
        price: 0.00,
        maxAge: 2,
        requiresTicketTypeId: null, // We'll update this after creating the first ticket type
        productId: accessPass.id,
        sortOrder: 3,
      },
      {
        name: 'Non-Jumper',
        price: 0.00,
        productId: accessPass.id,
        sortOrder: 4,
      },
    ],
    skipDuplicates: true,
  })

  // Create add-ons
  await prisma.addOn.createMany({
    data: [
      {
        name: 'Funbox Grippy Socks',
        description: 'All bouncers must wear Funbox Grippy Socks (add yours below 🧦).',
        price: 3.95,
        isRequired: true,
        imageUrl: '/grippy-socks.jpg',
        productId: accessPass.id,
        sortOrder: 1,
      },
      {
        name: 'Funbox Grippy Socks',
        description: 'All bouncers must wear Funbox Grippy Socks (add yours below 🧦).',
        price: 3.95,
        isRequired: true,
        imageUrl: '/grippy-socks.jpg',
        productId: familyPack.id,
        sortOrder: 1,
      },
    ],
    skipDuplicates: true,
  })

  // Create some sample sessions for today and tomorrow
  const today = new Date()
  today.setHours(14, 0, 0, 0) // 2 PM

  const sessions = []
  for (let i = 0; i < 8; i++) {
    const startTime = new Date(today)
    startTime.setMinutes(i * 15) // 2:00, 2:15, 2:30, 2:45, 3:00, 3:15, 3:30, 3:45

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + 90)

    sessions.push({
      startTime,
      endTime,
      maxCapacity: 50,
      bookedCapacity: Math.floor(Math.random() * 20), // Random bookings
      productId: accessPass.id,
    })
  }

  await prisma.session_Product.createMany({
    data: sessions,
    skipDuplicates: true,
  })

  // Create discount codes
  await prisma.discountCode.createMany({
    data: [
      {
        code: 'SAVE10',
        description: '10% off your booking',
        discountType: 'PERCENTAGE',
        discountValue: 10.00,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        maxUses: 100,
        businessId: funbox.id,
      },
      {
        code: 'WELCOME15',
        description: '$15 off orders over $50',
        discountType: 'FIXED_AMOUNT',
        discountValue: 15.00,
        minOrderAmount: 50.00,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        maxUses: 50,
        businessId: funbox.id,
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seed data created successfully!')
  console.log('📧 Admin login: admin@funbox.com / admin123')
  console.log('👤 Owner login: owner@funbox.com / owner123')
  console.log('🏢 Business: http://localhost:3000/funbox')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })