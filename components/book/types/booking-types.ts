export interface Business {
  id: string
  name: string
  slug: string
}

export interface Experience {
  id: string
  name: string
  slug: string
  maxCapacity?: number | null
}

export interface Event {
  id: string
  name: string
  slug: string
  description?: string | null
  basePrice: number
  maxCapacity?: number | null
}

export interface Session {
  id: string
  startTime: string
  endTime: string
  currentCount: number
  maxCapacity?: number | null
}

export interface AddOn {
  id: string
  name: string
  description?: string | null
  price: number
}

export interface CartItem {
  type: 'session' | 'addon'
  id: string
  name: string
  price: number
  quantity: number
}

export interface GuestForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  marketingOptIn: boolean
  termsAccepted: boolean
}

export interface PaymentForm {
  cardNumber: string
  expiryDate: string
  cvv: string
  nameOnCard: string
  billingZip: string
}

export interface BookingConfirmation {
  bookingId?: string
  status?: string
  message?: string
}