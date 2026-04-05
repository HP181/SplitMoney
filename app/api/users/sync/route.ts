import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await connectDB()

    const existingUser = await User.findOne({ clerkId: userId })
    
    if (existingUser) {
      existingUser.email = user.emailAddresses[0]?.emailAddress || ''
      existingUser.firstName = user.firstName || ''
      existingUser.lastName = user.lastName || ''
      existingUser.imageUrl = user.imageUrl || ''
      await existingUser.save()
      return NextResponse.json({ user: existingUser, isNew: false })
    }

    const newUser = await User.create({
      clerkId: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      imageUrl: user.imageUrl || '',
    })

    return NextResponse.json({ user: newUser, isNew: true })
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
