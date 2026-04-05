'use client'

import { use, useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2, Users, Receipt, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface BillItem {
  _id: string
  name: string
  price: number
  hasTax: boolean
  taxAmount: number
  totalPrice: number
  assignedTo: string[]
}

interface MemberShare {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  amount: number
}

interface Bill {
  _id: string
  name: string
  description?: string
  items: BillItem[]
  subtotal: number
  totalTax: number
  grandTotal: number
  memberShares: MemberShare[]
  createdAt: string
  createdBy: string
}

interface Member {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
}

interface Team {
  _id: string
  name: string
  members: Member[]
}

export default function BillDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; billId: string }>
}) {
  const { teamId, billId } = use(params)
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const { data: teamData, isLoading: teamLoading } = useSWR(`/api/teams/${teamId}`, fetcher)
  const { data: billData, isLoading: billLoading } = useSWR(
    `/api/teams/${teamId}/bills/${billId}`,
    fetcher
  )

  const team: Team | null = teamData?.team || null
  const bill: Bill | null = billData?.bill || null

  const getMemberInfo = (clerkId: string): Member | undefined => {
    return team?.members.find((m) => m.clerkId === clerkId)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/bills/${billId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete bill')
      }

      toast.success('Bill deleted successfully')
      router.push(`/dashboard/teams/${teamId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete bill')
    } finally {
      setDeleting(false)
    }
  }

  if (teamLoading || billLoading) {
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

  if (!team || !bill) {
    return (
      <div className="space-y-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Bill not found</EmptyTitle>
            <EmptyDescription>The bill you are looking for does not exist or you do not have access.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={`/dashboard/teams/${teamId}`}>
              <Button>Back to Team</Button>
            </Link>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/teams/${teamId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{bill.name}</h1>
            <p className="mt-1 text-muted-foreground">
              Created on {new Date(bill.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/teams/${teamId}/bills/${billId}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Bill</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this bill? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting && <Spinner className="mr-2" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {bill.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{bill.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subtotal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${bill.subtotal.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tax (13% HST)</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${bill.totalTax.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grand Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${bill.grandTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Items
          </CardTitle>
          <CardDescription>{bill.items.length} items in this bill</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.items.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      {item.name}
                      {item.hasTax && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          H
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${item.taxAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${item.totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.assignedTo.length === 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            All members
                          </Badge>
                        ) : (
                          item.assignedTo.map((clerkId) => {
                            const member = getMemberInfo(clerkId)
                            return (
                              <Avatar key={clerkId} className="h-6 w-6">
                                <AvatarImage src={member?.imageUrl} />
                                <AvatarFallback className="text-xs">
                                  {member?.firstName?.[0] || member?.email[0]?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                            )
                          })
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Split Summary
          </CardTitle>
          <CardDescription>How much each person owes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bill.memberShares.map((share) => {
              const member = getMemberInfo(share.clerkId)
              return (
                <div
                  key={share.clerkId}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member?.imageUrl} />
                      <AvatarFallback>
                        {share.firstName?.[0] || share.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {share.firstName} {share.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{share.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">${share.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">owes</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
