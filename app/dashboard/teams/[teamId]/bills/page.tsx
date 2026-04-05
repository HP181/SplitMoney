'use client'

import { use, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { ArrowLeft, Plus, Receipt, Search, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Bill {
  _id: string
  name: string
  description?: string
  grandTotal: number
  items: { name: string }[]
  createdAt: string
}

interface Team {
  _id: string
  name: string
}

export default function BillsListPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = use(params)
  const [search, setSearch] = useState('')

  const { data: teamData, isLoading: teamLoading } = useSWR(`/api/teams/${teamId}`, fetcher)
  const { data: billsData, isLoading: billsLoading } = useSWR(
    `/api/teams/${teamId}/bills`,
    fetcher
  )

  const team: Team | null = teamData?.team || null
  const bills: Bill[] = billsData?.bills || []

  const filteredBills = bills.filter(
    (bill) =>
      bill.name.toLowerCase().includes(search.toLowerCase()) ||
      bill.description?.toLowerCase().includes(search.toLowerCase())
  )

  const totalAmount = filteredBills.reduce((acc, bill) => acc + bill.grandTotal, 0)

  if (teamLoading || billsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!team) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Team not found</p>
        <Link href="/dashboard/teams">
          <Button>Back to Teams</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/teams/${teamId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bills</h1>
            <p className="mt-1 text-muted-foreground">{team.name}</p>
          </div>
        </div>
        <Link href={`/dashboard/teams/${teamId}/bills/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Bill
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBills.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search bills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredBills.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{search ? 'No bills found' : 'No bills yet'}</EmptyTitle>
                <EmptyDescription>
                  {search
                    ? 'Try adjusting your search terms'
                    : 'Add your first bill to start tracking expenses'}
                </EmptyDescription>
              </EmptyHeader>
              {!search && (
                <EmptyContent>
                  <Link href={`/dashboard/teams/${teamId}/bills/new`}>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Bill
                    </Button>
                  </Link>
                </EmptyContent>
              )}
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              All Bills
            </CardTitle>
            <CardDescription>
              {filteredBills.length} {filteredBills.length === 1 ? 'bill' : 'bills'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow key={bill._id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/teams/${teamId}/bills/${bill._id}`}
                          className="block"
                        >
                          <p className="font-medium hover:underline">{bill.name}</p>
                          {bill.description && (
                            <p className="line-clamp-1 text-sm text-muted-foreground">
                              {bill.description}
                            </p>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{bill.items.length} items</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ${bill.grandTotal.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
