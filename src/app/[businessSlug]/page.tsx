import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import Image from 'next/image'

interface ProductsPageProps {
  params: Promise<{ businessSlug: string }>
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { businessSlug } = await params
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    include: {
      experiences: {
        where: { isActive: true },
        include: {
          products: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              ticketTypes: {
                where: { isActive: true },
                orderBy: { sortOrder: 'asc' }
              }
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  if (!business) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {business.logoUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={business.logoUrl}
                  alt={business.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
              {business.description && (
                <p className="text-gray-600">{business.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Urgency Alert */}
        <div className="mb-6 p-4 bg-purple-100 border border-purple-200 rounded-lg flex items-center gap-3">
          <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">!</span>
          </div>
          <p className="text-purple-800">
            <strong>Spots sell out fast!</strong> Secure your tickets now to guarantee entry!
          </p>
        </div>

        {/* Products Sections */}
        {business.experiences.map((experience) => (
          <div key={experience.id} className="mb-12">
            {/* Regular Products */}
            {experience.products.some(p => !p.name.toLowerCase().includes('birthday')) && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {experience.name} Tickets
                </h2>
                <div className="space-y-4">
                  {experience.products
                    .filter(product => !product.name.toLowerCase().includes('birthday'))
                    .map((product) => (
                    <ProductCard key={product.id} product={product} businessSlug={businessSlug} />
                  ))}
                </div>
              </section>
            )}

            {/* Birthday Packages */}
            {experience.products.some(p => p.name.toLowerCase().includes('birthday')) && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  WEEKEND Birthday Packages
                </h2>
                <div className="space-y-4">
                  {experience.products
                    .filter(product => product.name.toLowerCase().includes('birthday'))
                    .map((product) => (
                    <ProductCard key={product.id} product={product} businessSlug={businessSlug} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductCard({ product, businessSlug }: {
  product: any,
  businessSlug: string
}) {
  const basePrice = product.ticketTypes?.[0]?.price || product.basePrice
  const isFree = basePrice === 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex">
          {/* Product Image */}
          <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {product.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {product.description}
                  </p>
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  {isFree ? (
                    <div className="text-lg font-bold text-green-600">FREE</div>
                  ) : (
                    <div className="text-lg font-bold text-gray-900">
                      ${basePrice.toFixed(2)}
                    </div>
                  )}
                  {product.duration && (
                    <div className="text-sm text-gray-500">
                      {product.duration} mins
                    </div>
                  )}
                </div>
              </div>
              <Button
                asChild
                className="mt-3 w-full sm:w-auto"
                style={{ backgroundColor: '#ff6b9d' }}
              >
                <Link href={`/${businessSlug}/book/${product.slug}`}>
                  {isFree ? 'Book Free Tour' : 'Select Time'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}