'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Plus, Users, ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Team {
  _id: string
  name: string
  description?: string
  members: { clerkId: string; email: string; firstName?: string; lastName?: string }[]
  createdAt: string
}

export default function TeamsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useSWR('/api/teams', fetcher)

  const teams: Team[] = data?.teams || []
  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams</h1>
          <p className="mt-1 text-muted-foreground">Manage your expense splitting teams</p>
        </div>
        <Link href="/dashboard/teams/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      ) : filteredTeams.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{search ? 'No teams found' : 'No teams yet'}</EmptyTitle>
                <EmptyDescription>
                  {search
                    ? 'Try adjusting your search terms'
                    : 'Create your first team to start splitting expenses'}
                </EmptyDescription>
              </EmptyHeader>
              {!search && (
                <EmptyContent>
                  <Link href="/dashboard/teams/new">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Team
                    </Button>
                  </Link>
                </EmptyContent>
              )}
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeams.map((team) => (
            <Link key={team._id} href={`/dashboard/teams/${team._id}`}>
              <Card className="h-full cursor-pointer transition-colors hover:bg-accent/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {team.name}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>{team.members.length} members</CardDescription>
                </CardHeader>
                {team.description && (
                  <CardContent>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{team.description}</p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
