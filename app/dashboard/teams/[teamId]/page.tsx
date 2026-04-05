'use client'

import { use, useState } from 'react'
import useSWR, { mutate } from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import {
  ArrowLeft,
  Users,
  Plus,
  Receipt,
  Trash2,
  Settings,
  UserMinus,
  Search,
  X,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Member {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  role: 'owner' | 'member'
}

interface Team {
  _id: string
  name: string
  description?: string
  members: Member[]
}

interface Bill {
  _id: string
  name: string
  grandTotal: number
  createdAt: string
}

interface SearchUser {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = use(params)
  const router = useRouter()
  const { user } = useUser()
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [addingMember, setAddingMember] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState(false)
  const [leavingTeam, setLeavingTeam] = useState(false)
  const [removingMember, setRemovingMember] = useState<string | null>(null)

  const { data: teamData, isLoading: teamLoading } = useSWR(`/api/teams/${teamId}`, fetcher)
  const { data: billsData, isLoading: billsLoading } = useSWR(
    `/api/teams/${teamId}/bills`,
    fetcher
  )

  const team: Team | null = teamData?.team || null
  const bills: Bill[] = billsData?.bills || []
  const isOwner = team?.members.find((m) => m.clerkId === user?.id)?.role === 'owner'

  const handleSearchUsers = async () => {
    if (searchEmail.length < 3) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const res = await fetch(`/api/users/search?email=${encodeURIComponent(searchEmail)}`)
      const data = await res.json()
      // Filter out existing members
      const existingIds = team?.members.map((m) => m.clerkId) || []
      setSearchResults(data.users?.filter((u: SearchUser) => !existingIds.includes(u.clerkId)) || [])
    } catch {
      toast.error('Failed to search users')
    } finally {
      setSearching(false)
    }
  }

  const handleAddMember = async (memberClerkId: string) => {
    setAddingMember(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberClerkId }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add member')
      }

      toast.success('Member added successfully')
      mutate(`/api/teams/${teamId}`)
      setSearchEmail('')
      setSearchResults([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleRemoveMember = async (memberClerkId: string) => {
    setRemovingMember(memberClerkId)
    try {
      const res = await fetch(`/api/teams/${teamId}/members?memberClerkId=${memberClerkId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to remove member')
      }

      const data = await res.json()
      toast.success('Member removed successfully')

      if (data.removed) {
        router.push('/dashboard/teams')
      } else {
        mutate(`/api/teams/${teamId}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    } finally {
      setRemovingMember(null)
    }
  }

  const handleLeaveTeam = async () => {
    if (!user?.id) return
    setLeavingTeam(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/members?memberClerkId=${user.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to leave team')
      }

      toast.success('Left team successfully')
      router.push('/dashboard/teams')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to leave team')
    } finally {
      setLeavingTeam(false)
    }
  }

  const handleDeleteTeam = async () => {
    setDeletingTeam(true)
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete team')
      }

      toast.success('Team deleted successfully')
      router.push('/dashboard/teams')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete team')
    } finally {
      setDeletingTeam(false)
    }
  }

  if (teamLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Team not found</EmptyTitle>
            <EmptyDescription>The team you are looking for does not exist or you do not have access.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/dashboard/teams">
              <Button>Back to Teams</Button>
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teams">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{team.name}</h1>
            {team.description && <p className="mt-1 text-muted-foreground">{team.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <UserMinus className="h-4 w-4" />
                  Leave Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this team? You will need to be invited again to
                    rejoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveTeam} disabled={leavingTeam}>
                    {leavingTeam && <Spinner className="mr-2" />}
                    Leave
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Team
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Team</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the team and all
                    associated bills.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteTeam}
                    disabled={deletingTeam}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingTeam && <Spinner className="mr-2" />}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({team.members.length})
                </CardTitle>
                <CardDescription>Manage team members</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>Search for a user by email to add them</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search by email..."
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                      />
                      <Button onClick={handleSearchUsers} disabled={searching}>
                        {searching ? <Spinner /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                    {searchResults.length > 0 && (
                      <div className="max-h-64 space-y-2 overflow-auto">
                        {searchResults.map((searchUser) => (
                          <div
                            key={searchUser.clerkId}
                            className="flex items-center justify-between rounded-lg border border-border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={searchUser.imageUrl} />
                                <AvatarFallback>
                                  {searchUser.firstName?.[0] || searchUser.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {searchUser.firstName} {searchUser.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">{searchUser.email}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddMember(searchUser.clerkId)}
                              disabled={addingMember}
                            >
                              {addingMember ? <Spinner /> : 'Add'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchEmail.length >= 3 && searchResults.length === 0 && !searching && (
                      <p className="text-center text-sm text-muted-foreground">No users found</p>
                    )}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {team.members.map((member) => (
                <div
                  key={member.clerkId}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.imageUrl} />
                      <AvatarFallback>
                        {member.firstName?.[0] || member.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {member.firstName} {member.lastName}
                        {member.role === 'owner' && (
                          <Badge variant="secondary" className="text-xs">
                            Owner
                          </Badge>
                        )}
                        {member.clerkId === user?.id && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  {isOwner && member.clerkId !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMember(member.clerkId)}
                      disabled={removingMember === member.clerkId}
                    >
                      {removingMember === member.clerkId ? (
                        <Spinner />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bills Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Bills ({bills.length})
                </CardTitle>
                <CardDescription>View and manage expenses</CardDescription>
              </div>
              <Link href={`/dashboard/teams/${teamId}/bills/new`}>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Bill
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {billsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : bills.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No bills yet</EmptyTitle>
                  <EmptyDescription>Add your first bill to start splitting</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link href={`/dashboard/teams/${teamId}/bills/new`}>
                    <Button size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Bill
                    </Button>
                  </Link>
                </EmptyContent>
              </Empty>
            ) : (
              <div className="space-y-3">
                {bills.slice(0, 5).map((bill) => (
                  <Link key={bill._id} href={`/dashboard/teams/${teamId}/bills/${bill._id}`}>
                    <div className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent/50">
                      <div>
                        <p className="font-medium">{bill.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold">${bill.grandTotal.toFixed(2)}</p>
                    </div>
                  </Link>
                ))}
                {bills.length > 5 && (
                  <Link href={`/dashboard/teams/${teamId}/bills`}>
                    <Button variant="ghost" className="w-full">
                      View all {bills.length} bills
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
