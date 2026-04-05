import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
