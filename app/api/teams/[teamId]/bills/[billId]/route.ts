// app/api/teams/[teamId]/bills/[billId]/route.ts
import { sendBillEmails } from '@/lib/email';
import Bill from '@/lib/models/Bill';
import Team from '@/lib/models/Team';
import connectDB from '@/lib/mongodb';
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server';

const TAX_RATE = 0.13

function calculateBill(items: { name: string; price: number; hasTax: boolean; assignedTo: string[] }[]) {
  let subtotal = 0
  let totalTax = 0

  const processedItems = items.map((item) => {
    const taxAmount = item.hasTax ? item.price * TAX_RATE : 0
    const totalPrice = item.price + taxAmount
    subtotal += item.price
    totalTax += taxAmount
    return { ...item, taxAmount, totalPrice }
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
  members.forEach((m) => { shares[m.clerkId] = 0 })

  items.forEach((item) => {
    if (item.assignedTo.length === 0) {
      const perPerson = item.totalPrice / members.length
      members.forEach((m) => { shares[m.clerkId] += perPerson })
    } else {
      const perPerson = item.totalPrice / item.assignedTo.length
      item.assignedTo.forEach((clerkId) => {
        if (shares[clerkId] !== undefined) shares[clerkId] += perPerson
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
  { params }: { params: Promise<{ teamId: string; billId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, billId } = await params
    await connectDB()

    const team = await Team.findOne({ _id: teamId, 'members.clerkId': userId })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const bill = await Bill.findOne({ _id: billId, teamId })
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    return NextResponse.json({ bill })
  } catch (error) {
    console.error('Error fetching bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; billId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, billId } = await params
    const body = await request.json()
    const { name, description, receiptUrl, items } = body

    await connectDB()

    const team = await Team.findOne({ _id: teamId, 'members.clerkId': userId })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const bill = await Bill.findOne({ _id: billId, teamId })
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    if (name) bill.name = name
    if (description !== undefined) bill.description = description
    if (receiptUrl !== undefined) bill.receiptUrl = receiptUrl

    let memberShares = bill.memberShares

    if (items && items.length > 0) {
      const calculated = calculateBill(items)
      memberShares = calculateMemberShares(calculated.items, team.members)

      bill.items = calculated.items
      bill.subtotal = calculated.subtotal
      bill.totalTax = calculated.totalTax
      bill.grandTotal = calculated.grandTotal
      bill.memberShares = memberShares
    }

    await bill.save()

    // Send emails to all members (non-blocking)
    sendBillEmails({
      type: 'updated',
      teamName: team.name,
      billName: bill.name,
      billId: bill._id.toString(),
      teamId,
      grandTotal: bill.grandTotal,
      memberShares: memberShares.map((s: { email: string; firstName?: string; lastName?: string; amount: number }) => ({
        email: s.email,
        firstName: s.firstName,
        lastName: s.lastName,
        amount: s.amount,
      })),
    }).catch((err) => console.error('Email sending failed:', err))

    return NextResponse.json({ bill })
  } catch (error) {
    console.error('Error updating bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string; billId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId, billId } = await params
    await connectDB()

    const team = await Team.findOne({ _id: teamId, 'members.clerkId': userId })
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const bill = await Bill.findOneAndDelete({ _id: billId, teamId })
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Bill deleted successfully' })
  } catch (error) {
    console.error('Error deleting bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}