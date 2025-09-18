const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedGuestBookings() {
  try {
    console.log('Starting to seed bookings for benwaters81@gmail.com...')

    // Find the business (should be Ben Waters' business)
    const business = await prisma.business.findFirst({
      where: {
        users: {
          some: {
            email: 'benwaters81@gmail.com'
          }
        }
      }
    })

    if (!business) {
      console.log('Business not found for benwaters81@gmail.com')
      return
    }

    console.log(`Found business: ${business.name}`)

    // Find or create the guest
    let guest = await prisma.guest.findFirst({
      where: { email: 'benwaters81@gmail.com' }
    })

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          firstName: 'Ben',
          lastName: 'Waters',
          email: 'benwaters81@gmail.com',
          phone: '+1-555-0123'
        }
      })
      console.log('Created guest for Ben Waters')
    } else {
      console.log('Found existing guest for Ben Waters')
    }

    // Get all experiences for this business
    const experiences = await prisma.experience.findMany({
      where: { businessId: business.id },
      include: {
        events: {
          include: {
            sessions: true
          }
        }
      }
    })

    if (experiences.length === 0) {
      console.log('No experiences found. Please run the main seed script first.')
      return
    }

    // Get all add-ons for this business
    const addOns = await prisma.addOn.findMany({
      where: { businessId: business.id }
    })

    // Create 10 diverse bookings
    const bookingPromises = []
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

    for (let i = 0; i < 10; i++) {
      // Pick a random experience and session
      const experience = experiences[Math.floor(Math.random() * experiences.length)]
      const events = experience.events
      if (events.length === 0) continue

      const event = events[Math.floor(Math.random() * events.length)]
      const sessions = event.sessions
      if (sessions.length === 0) continue

      const session = sessions[Math.floor(Math.random() * sessions.length)]

      const quantity = Math.floor(Math.random() * 4) + 1 // 1-4 tickets
      const status = statuses[Math.floor(Math.random() * statuses.length)]

      // Debug session data
      console.log('Session basePrice:', session.basePrice, typeof session.basePrice)

      // Calculate base total (session price * quantity) - handle potential decimal
      const sessionPrice = session.basePrice ? Number(session.basePrice) : 50 // default price if null
      const baseTotal = sessionPrice * quantity

      // Random selection of add-ons (0-2 add-ons)
      const numAddOns = Math.floor(Math.random() * 3) // 0, 1, or 2 add-ons
      const selectedAddOns = []

      for (let j = 0; j < numAddOns && addOns.length > 0; j++) {
        const addOn = addOns[Math.floor(Math.random() * addOns.length)]
        if (!selectedAddOns.find(a => a.id === addOn.id)) {
          selectedAddOns.push(addOn)
        }
      }

      // Calculate add-on total
      const addOnTotal = selectedAddOns.reduce((sum, addOn) => {
        return sum + (Number(addOn.price) * quantity)
      }, 0)

      const totalAmount = baseTotal + addOnTotal

      // Create the booking
      const bookingPromise = prisma.booking.create({
        data: {
          guest: {
            connect: { id: guest.id }
          },
          session: {
            connect: { id: session.id }
          },
          quantity,
          total: totalAmount,
          status,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          items: {
            create: [
              // Session item
              {
                quantity,
                unitPrice: sessionPrice,
                totalPrice: baseTotal,
                itemType: 'SESSION'
              },
              // Add-on items
              ...selectedAddOns.map(addOn => ({
                quantity,
                unitPrice: Number(addOn.price),
                totalPrice: Number(addOn.price) * quantity,
                itemType: 'ADD_ON',
                addOn: {
                  connect: { id: addOn.id }
                }
              }))
            ]
          }
        },
        include: {
          items: true,
          session: {
            include: {
              event: {
                include: {
                  experience: true
                }
              }
            }
          }
        }
      })

      bookingPromises.push(bookingPromise)
    }

    const bookings = await Promise.all(bookingPromises)

    console.log(`✅ Successfully created ${bookings.length} bookings for Ben Waters`)

    // Log summary
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.session.event.experience.name} - ${booking.session.event.name} (${booking.status}) - $${Number(booking.total).toFixed(2)}`)
    })

  } catch (error) {
    console.error('Error seeding guest bookings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedGuestBookings()