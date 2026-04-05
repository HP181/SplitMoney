import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import Bill from '@/lib/models/Bill'

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

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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
    const { name, description } = body

    await connectDB()

    const team = await Team.findOne({
      _id: teamId,
      'members.clerkId': userId,
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (name) team.name = name
    if (description !== undefined) team.description = description
    await team.save()

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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
      'members.role': 'owner',
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found or not authorized' }, { status: 404 })
    }

    const ownerMember = team.members.find((m) => m.clerkId === userId)
    if (!ownerMember || ownerMember.role !== 'owner') {
      return NextResponse.json({ error: 'Only owner can delete team' }, { status: 403 })
    }

    await Bill.deleteMany({ teamId })
    await Team.deleteOne({ _id: teamId })

    return NextResponse.json({ message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
