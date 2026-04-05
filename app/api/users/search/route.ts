import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/lib/models/User'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email || email.length < 3) {
      return NextResponse.json({ users: [] })
    }

    await connectDB()

    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      clerkId: { $ne: userId },
    })
      .select('clerkId email firstName lastName imageUrl')
      .limit(10)

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
