'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Users, Receipt, DollarSign, Plus, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Team {
  _id: string
  name: string
  description?: string
  members: { clerkId: string; email: string; firstName?: string; lastName?: string }[]
}

export default function DashboardPage() {
  useEffect(() => {
    // Sync user on first load
    fetch('/api/users/sync', { method: 'POST' })
  }, [])

  const { data: teamsData, isLoading } = useSWR('/api/teams', fetcher)

  const teams: Team[] = teamsData?.teams || []
  const totalMembers = teams.reduce((acc, team) => acc + team.members.length, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back! Here is an overview of your expense splitting.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{teams.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalMembers}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13%</div>
            <p className="text-xs text-muted-foreground">HST applied to marked items</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Your Teams</h2>
          <Link href="/dashboard/teams/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No teams yet</EmptyTitle>
                  <EmptyDescription>Create your first team to start splitting expenses</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link href="/dashboard/teams/new">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Team
                    </Button>
                  </Link>
                </EmptyContent>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link key={team._id} href={`/dashboard/teams/${team._id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {team.name}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>{team.members.length} members</CardDescription>
                  </CardHeader>
                  {team.description && (
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {team.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
