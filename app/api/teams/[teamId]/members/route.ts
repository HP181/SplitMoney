import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import User from '@/lib/models/User'

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
    const { memberClerkId } = body

    if (!memberClerkId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    await connectDB()

    const team = await Team.findOne({
      _id: teamId,
      'members.clerkId': userId,
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const existingMember = team.members.find((m) => m.clerkId === memberClerkId)
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    const userToAdd = await User.findOne({ clerkId: memberClerkId })
    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    team.members.push({
      userId: userToAdd._id,
      clerkId: memberClerkId,
      email: userToAdd.email,
      firstName: userToAdd.firstName,
      lastName: userToAdd.lastName,
      imageUrl: userToAdd.imageUrl,
      role: 'member',
      joinedAt: new Date(),
    })

    await team.save()

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error adding member:', error)
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
    const { searchParams } = new URL(request.url)
    const memberClerkId = searchParams.get('memberClerkId')

    if (!memberClerkId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    await connectDB()

    const team = await Team.findOne({
      _id: teamId,
      'members.clerkId': userId,
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const currentUserMember = team.members.find((m) => m.clerkId === userId)
    const targetMember = team.members.find((m) => m.clerkId === memberClerkId)

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Only owner can remove others, or user can remove themselves
    if (currentUserMember?.role !== 'owner' && memberClerkId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Owner cannot leave if they are the only owner
    if (targetMember.role === 'owner') {
      const owners = team.members.filter((m) => m.role === 'owner')
      if (owners.length === 1) {
        return NextResponse.json({ error: 'Cannot remove the only owner' }, { status: 400 })
      }
    }

    team.members = team.members.filter((m) => m.clerkId !== memberClerkId)
    await team.save()

    return NextResponse.json({ team, removed: memberClerkId === userId })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
