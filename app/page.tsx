import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Receipt, Users, Calculator } from 'lucide-react'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">SplitWise</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Split Bills Effortlessly with Your Team
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              Create teams, add expenses, upload receipts, and let us calculate who owes what.
              Tax handling included with automatic 13% HST detection.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Start Splitting
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/50 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
              Everything You Need
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-6">
                <Users className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-semibold text-card-foreground">Team Management</h3>
                <p className="text-muted-foreground">
                  Create teams, invite members by email, and manage your expense groups easily.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <Receipt className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-semibold text-card-foreground">Receipt Scanning</h3>
                <p className="text-muted-foreground">
                  Upload receipt images and we will automatically extract items and prices with AI.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <Calculator className="mb-4 h-10 w-10 text-primary" />
                <h3 className="mb-2 text-xl font-semibold text-card-foreground">Smart Splitting</h3>
                <p className="text-muted-foreground">
                  Assign items to specific members with automatic 13% tax calculation for HST items.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-muted-foreground">
          <p>SplitWise - Split bills with ease</p>
        </div>
      </footer>
    </div>
  )
}
