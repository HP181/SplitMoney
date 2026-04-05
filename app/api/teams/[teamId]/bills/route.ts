import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import Bill from '@/lib/models/Bill'

const TAX_RATE = 0.13

function calculateBill(items: { name: string; price: number; hasTax: boolean; assignedTo: string[] }[]) {
  let subtotal = 0
  let totalTax = 0

  const processedItems = items.map((item) => {
    const taxAmount = item.hasTax ? item.price * TAX_RATE : 0
    const totalPrice = item.price + taxAmount
    subtotal += item.price
    totalTax += taxAmount
    return {
      ...item,
      taxAmount,
      totalPrice,
    }
  })

  return {
    items: processedItems,
    subtotal,
    totalTax,
    grandTotal: subtotal + totalTax,
  }
}

function calculateMemberShares(
  items: { totalPrice: number; assignedTo: string[] }[],
  members: { clerkId: string; email: string; firstName?: string; lastName?: string }[]
) {
  const shares: Record<string, number> = {}

  members.forEach((m) => {
    shares[m.clerkId] = 0
  })

  items.forEach((item) => {
    if (item.assignedTo.length === 0) {
      // Split among all members if not assigned
      const perPerson = item.totalPrice / members.length
      members.forEach((m) => {
        shares[m.clerkId] += perPerson
      })
    } else {
      // Split among assigned members
      const perPerson = item.totalPrice / item.assignedTo.length
      item.assignedTo.forEach((clerkId) => {
        if (shares[clerkId] !== undefined) {
          shares[clerkId] += perPerson
        }
      })
    }
  })

  return members.map((m) => ({
    clerkId: m.clerkId,
    email: m.email,
    firstName: m.firstName,
    lastName: m.lastName,
    amount: Math.round(shares[m.clerkId] * 100) / 100,
  }))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await params

    await connectDB()

    const team = await Team.findOne({
      _id: teamId,
      'members.clerkId': userId,
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const bills = await Bill.find({ teamId }).sort({ createdAt: -1 })

    return NextResponse.json({ bills })
  } catch (error) {
    console.error('Error fetching bills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await params
    const body = await request.json()
    const { name, description, receiptUrl, items } = body

    if (!name || !items || items.length === 0) {
      return NextResponse.json({ error: 'Name and items are required' }, { status: 400 })
    }

    await connectDB()

    const team = await Team.findOne({
      _id: teamId,
      'members.clerkId': userId,
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const calculated = calculateBill(items)
    const memberShares = calculateMemberShares(calculated.items, team.members)

    const bill = await Bill.create({
      teamId,
      name,
      description,
      receiptUrl,
      items: calculated.items,
      subtotal: calculated.subtotal,
      totalTax: calculated.totalTax,
      grandTotal: calculated.grandTotal,
      memberShares,
      createdBy: userId,
    })

    return NextResponse.json({ bill }, { status: 201 })
  } catch (error) {
    console.error('Error creating bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
