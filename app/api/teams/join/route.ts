import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Team from '@/lib/models/Team'
import User from '@/lib/models/User'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { teamId } = body

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    await connectDB()

    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    const existingMember = team.members.find((m) => m.clerkId === userId)
    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this team' }, { status: 400 })
    }

    let dbUser = await User.findOne({ clerkId: userId })
    if (!dbUser) {
      dbUser = await User.create({
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.imageUrl || '',
      })
    }

    team.members.push({
      userId: dbUser._id,
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      imageUrl: user.imageUrl || '',
      role: 'member',
      joinedAt: new Date(),
    })

    await team.save()

    return NextResponse.json({ team })
  } catch (error) {
    console.error('Error joining team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
