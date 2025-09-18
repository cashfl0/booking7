import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, Plus } from 'lucide-react'
import Link from 'next/link'
import { AddOnList } from '@/components/dashboard/addon-list'

interface AddOn {
  id: string
  name: string
  description: string | null
  price: number
  isActive: boolean
  sortOrder: number
  _count: {
    bookingItems: number
    events: number
  }
}

async function getAddOns(): Promise<AddOn[]> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.businessId) {
    redirect('/auth/signin')
  }

  const addons = await prisma.addOn.findMany({
    where: {
      businessId: session.user.businessId
    },
    include: {
      _count: {
        select: {
          bookingItems: true,
          events: true
        }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  return addons.map(addon => ({
    ...addon,
    price: Number(addon.price)
  }))
}

export default async function AddOnsPage() {
  const addons = await getAddOns()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="w-8 h-8" />
            Add-ons
          </h1>
          <p className="text-muted-foreground">
            Create and manage global add-ons for your business
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/experiences/add-ons/new">
            <Plus className="w-4 h-4 mr-2" />
            Create Add-on
          </Link>
        </Button>
      </div>

      <AddOnList initialAddons={addons} />
    </div>
  )
}