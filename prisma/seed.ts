import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test business
  const business = await prisma.business.upsert({
    where: { slug: 'funbox' },
    update: {},
    create: {
      name: 'Funbox Entertainment',
      slug: 'funbox',
      description: 'Premium entertainment experiences for all ages'
    }
  })

  console.log(`Created business: ${business.name}`)

  // Create business owner
  const hashedPassword = await bcrypt.hash('password123', 10)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@funbox.com' },
    update: {},
    create: {
      email: 'owner@funbox.com',
      firstName: 'Bob',
      lastName: 'Smith',
      password: hashedPassword,
      role: 'OWNER',
      businessId: business.id
    }
  })

  console.log(`Created owner: ${owner.email}`)

  // Create employee
  const employee = await prisma.user.upsert({
    where: { email: 'employee@funbox.com' },
    update: {},
    create: {
      email: 'employee@funbox.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      password: hashedPassword,
      role: 'EMPLOYEE',
      businessId: business.id
    }
  })

  console.log(`Created employee: ${employee.email}`)

  // Create Ben's separate business
  const benBusiness = await prisma.business.upsert({
    where: { slug: 'dark-helmets-apocalypse' },
    update: {},
    create: {
      name: "Dark Helmet's Apocalypse",
      slug: 'dark-helmets-apocalypse',
      description: 'The ultimate apocalyptic adventure experiences'
    }
  })

  console.log(`Created Ben's business: ${benBusiness.name}`)

  // Create test user Ben with his own business
  const benPassword = await bcrypt.hash('ben', 10)
  const ben = await prisma.user.upsert({
    where: { email: 'benwaters81@gmail.com' },
    update: {},
    create: {
      email: 'benwaters81@gmail.com',
      firstName: 'Ben',
      lastName: 'Waters',
      password: benPassword,
      role: 'OWNER',
      businessId: benBusiness.id
    }
  })

  console.log(`Created test user: ${ben.email}`)

  // Create experiences
  const escapeRoom = await prisma.experience.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: 'escape-room'
      }
    },
    update: {},
    create: {
      name: 'Mystery Escape Room',
      slug: 'escape-room',
      description: 'Test your wits in our challenging escape room experience',
      basePrice: 35.00,
      duration: 60,
      maxCapacity: 8,
      businessId: business.id
    }
  })

  const laserTag = await prisma.experience.upsert({
    where: {
      businessId_slug: {
        businessId: business.id,
        slug: 'laser-tag'
      }
    },
    update: {},
    create: {
      name: 'Laser Tag Arena',
      slug: 'laser-tag',
      description: 'High-tech laser tag battles in our futuristic arena',
      basePrice: 25.00,
      duration: 30,
      maxCapacity: 12,
      businessId: business.id
    }
  })

  console.log(`Created experiences: ${escapeRoom.name}, ${laserTag.name}`)

  // Create events
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  const escapeEvent = await prisma.event.create({
    data: {
      name: 'Weekend Mystery Challenge',
      slug: 'weekend-mystery-challenge',
      description: 'Special weekend event with bonus puzzles',
      startDate: tomorrow,
      endDate: nextWeek,
      experienceId: escapeRoom.id
    }
  })

  const laserEvent = await prisma.event.create({
    data: {
      name: 'Battle Royale Tournament',
      slug: 'battle-royale-tournament',
      description: 'Competitive laser tag tournament',
      startDate: tomorrow,
      endDate: nextWeek,
      experienceId: laserTag.id
    }
  })

  console.log(`Created events: ${escapeEvent.name}, ${laserEvent.name}`)

  // Create sessions for escape room
  const sessions = []
  for (let i = 0; i < 3; i++) {
    const sessionDate = new Date(tomorrow)
    sessionDate.setDate(sessionDate.getDate() + i)

    // Create 3 sessions per day (2pm, 4pm, 6pm)
    for (const hour of [14, 16, 18]) {
      const startTime = new Date(sessionDate)
      startTime.setHours(hour, 0, 0, 0)
      const endTime = new Date(startTime)
      endTime.setHours(hour + 1, 0, 0, 0)

      sessions.push({
        startTime,
        endTime,
        eventId: escapeEvent.id
      })
    }
  }

  await prisma.session.createMany({ data: sessions })

  // Create sessions for laser tag
  const laserSessions = []
  for (let i = 0; i < 3; i++) {
    const sessionDate = new Date(tomorrow)
    sessionDate.setDate(sessionDate.getDate() + i)

    // Create 4 sessions per day (1pm, 2:30pm, 4pm, 5:30pm)
    for (const [hour, minute] of [[13, 0], [14, 30], [16, 0], [17, 30]]) {
      const startTime = new Date(sessionDate)
      startTime.setHours(hour, minute, 0, 0)
      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + 30)

      laserSessions.push({
        startTime,
        endTime,
        eventId: laserEvent.id
      })
    }
  }

  await prisma.session.createMany({ data: laserSessions })

  console.log(`Created ${sessions.length + laserSessions.length} sessions`)

  // Create add-ons (now global to business)
  const addOns = await prisma.addOn.createMany({
    data: [
      {
        name: 'Photo Package',
        description: 'Professional photos of your experience',
        price: 15.00,
        businessId: business.id
      },
      {
        name: 'Hint Package',
        description: 'Extra hints to help solve the puzzles',
        price: 5.00,
        businessId: business.id
      },
      {
        name: 'Victory Celebration',
        description: 'Champagne toast for successful teams',
        price: 20.00,
        businessId: business.id
      },
      {
        name: 'Laser Vest Upgrade',
        description: 'Premium vest with better accuracy',
        price: 10.00,
        businessId: business.id
      },
      {
        name: 'Team Photo',
        description: 'Group photo after the battle',
        price: 12.00,
        businessId: business.id
      }
    ]
  })

  // Get the created add-ons so we can associate them with events
  const createdAddOns = await prisma.addOn.findMany({
    where: { businessId: business.id }
  })

  // Associate some add-ons with events
  await prisma.eventAddOn.createMany({
    data: [
      // Escape room event add-ons
      { eventId: escapeEvent.id, addOnId: createdAddOns.find(a => a.name === 'Photo Package')!.id },
      { eventId: escapeEvent.id, addOnId: createdAddOns.find(a => a.name === 'Hint Package')!.id },
      { eventId: escapeEvent.id, addOnId: createdAddOns.find(a => a.name === 'Victory Celebration')!.id },

      // Laser tag event add-ons
      { eventId: laserEvent.id, addOnId: createdAddOns.find(a => a.name === 'Laser Vest Upgrade')!.id },
      { eventId: laserEvent.id, addOnId: createdAddOns.find(a => a.name === 'Team Photo')!.id },
      { eventId: laserEvent.id, addOnId: createdAddOns.find(a => a.name === 'Photo Package')!.id }, // Photo package available for both
    ]
  })

  console.log('Created add-ons')

  // Create sample guests and bookings
  const guest1 = await prisma.guest.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '555-0123'
    }
  })

  const guest2 = await prisma.guest.create({
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@email.com',
      phone: '555-0456'
    }
  })

  // Create sample bookings
  const firstSession = await prisma.session.findFirst({
    where: { eventId: escapeEvent.id }
  })

  if (firstSession) {
    await prisma.booking.create({
      data: {
        sessionId: firstSession.id,
        guestId: guest1.id,
        quantity: 4,
        total: 140.00,
        status: 'CONFIRMED',
        items: {
          create: [
            {
              quantity: 4,
              unitPrice: 35.00,
              totalPrice: 140.00,
              itemType: 'SESSION'
            }
          ]
        }
      }
    })

    await prisma.session.update({
      where: { id: firstSession.id },
      data: { currentCount: 4 }
    })
  }

  console.log('Created sample bookings')
  console.log('✅ Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })