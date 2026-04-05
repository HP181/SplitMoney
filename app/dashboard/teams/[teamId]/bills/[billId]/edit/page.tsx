'use client'

import { use, useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Upload, Receipt, ImageIcon, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
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
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

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

interface BillItemDB {
  _id: string
  name: string
  price: number
  hasTax: boolean
  assignedTo: string[]
}

interface BillItem {
  id: string
  name: string
  price: number
  hasTax: boolean
  assignedTo: string[]
}

interface Bill {
  _id: string
  name: string
  description?: string
  items: BillItemDB[]
}

interface MemberShare {
  clerkId: string
  amount: number
}

const TAX_RATE = 0.13

// Mirrors the server-side calculation so the preview matches what gets saved
function calculateLiveMemberShares(items: BillItem[], members: Member[]): MemberShare[] {
  const shares: Record<string, number> = {}
  members.forEach((m) => { shares[m.clerkId] = 0 })

  items.forEach((item) => {
    if (!item.name.trim() || item.price <= 0) return
    const taxAmount = item.hasTax ? item.price * TAX_RATE : 0
    const totalPrice = item.price + taxAmount

    if (item.assignedTo.length === 0) {
      // Split equally among all members
      const perPerson = totalPrice / members.length
      members.forEach((m) => { shares[m.clerkId] += perPerson })
    } else {
      // Split among assigned members only
      const perPerson = totalPrice / item.assignedTo.length
      item.assignedTo.forEach((clerkId) => {
        if (shares[clerkId] !== undefined) {
          shares[clerkId] += perPerson
        }
      })
    }
  })

  return members.map((m) => ({
    clerkId: m.clerkId,
    amount: Math.round(shares[m.clerkId] * 100) / 100,
  }))
}

export default function EditBillPage({
  params,
}: {
  params: Promise<{ teamId: string; billId: string }>
}) {
  const { teamId, billId } = use(params)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<BillItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)

  const { data: teamData, isLoading: teamLoading } = useSWR(`/api/teams/${teamId}`, fetcher)
  const { data: billData, isLoading: billLoading } = useSWR(
    `/api/teams/${teamId}/bills/${billId}`,
    fetcher
  )

  const team: Team | null = teamData?.team || null
  const bill: Bill | null = billData?.bill || null

  useEffect(() => {
    if (bill && !initialized) {
      setName(bill.name)
      setDescription(bill.description || '')
      setItems(
        bill.items.map((item) => ({
          id: item._id,
          name: item.name,
          price: item.price,
          hasTax: item.hasTax,
          assignedTo: item.assignedTo,
        }))
      )
      setInitialized(true)
    }
  }, [bill, initialized])

  const addItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: '', price: 0, hasTax: false, assignedTo: [] },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (
    id: string,
    field: keyof BillItem,
    value: string | number | boolean | string[]
  ) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const toggleMemberAssignment = (itemId: string, clerkId: string) => {
    setItems(
      items.map((item) => {
        if (item.id !== itemId) return item
        const isAssigned = item.assignedTo.includes(clerkId)
        return {
          ...item,
          assignedTo: isAssigned
            ? item.assignedTo.filter((id) => id !== clerkId)
            : [...item.assignedTo, clerkId],
        }
      })
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64 = reader.result as string
        const res = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        })

        if (!res.ok) throw new Error('Failed to process receipt')

        const data = await res.json()
        if (data.items && data.items.length > 0) {
          const newItems = data.items.map(
            (item: { name: string; price: number; hasTax: boolean }, index: number) => ({
              id: `ocr-${index}-${Date.now()}`,
              name: item.name,
              price: item.price,
              hasTax: item.hasTax,
              assignedTo: [],
            })
          )
          setItems(newItems)
          toast.success(`Extracted ${data.items.length} items from receipt`)
        } else {
          toast.error('No items found in receipt')
        }
      } catch {
        toast.error('Failed to process receipt')
      } finally {
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  const calculateTotals = () => {
    let subtotal = 0
    let totalTax = 0

    items.forEach((item) => {
      subtotal += item.price
      if (item.hasTax) {
        totalTax += item.price * TAX_RATE
      }
    })

    return { subtotal, totalTax, grandTotal: subtotal + totalTax }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Bill name is required')
      return
    }

    const validItems = items.filter((item) => item.name.trim() && item.price > 0)
    if (validItems.length === 0) {
      toast.error('At least one valid item is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/bills/${billId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          items: validItems.map((item) => ({
            name: item.name,
            price: item.price,
            hasTax: item.hasTax,
            assignedTo: item.assignedTo,
          })),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update bill')
      }

      toast.success('Bill updated successfully')
      router.push(`/dashboard/teams/${teamId}/bills/${billId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update bill')
    } finally {
      setSaving(false)
    }
  }

  const totals = calculateTotals()
  const liveShares = team ? calculateLiveMemberShares(items, team.members) : []

  if (teamLoading || billLoading || !initialized) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!team || !bill) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Bill not found</p>
        <Link href={`/dashboard/teams/${teamId}`}>
          <Button>Back to Team</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/teams/${teamId}/bills/${billId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Bill</h1>
          <p className="mt-1 text-muted-foreground">Update bill details and items</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Bill Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Bill Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Bill Name</FieldLabel>
                  <Input
                    id="name"
                    placeholder="e.g., Dinner at Restaurant"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="Add any notes about this bill"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Receipt Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Receipt Upload
                  </CardTitle>
                  <CardDescription>
                    Upload a new receipt to replace items (H = 13% HST)
                  </CardDescription>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? <Spinner /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'Processing...' : 'Upload Receipt'}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Items</CardTitle>
                  <CardDescription>
                    Edit items. Click avatars to assign — unassigned items split equally.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-50">Item Name</TableHead>
                      <TableHead className="w-30">Price</TableHead>
                      <TableHead className="w-20">Tax (13%)</TableHead>
                      <TableHead className="w-25 text-right">Total</TableHead>
                      <TableHead className="min-w-50">Assigned To</TableHead>
                      <TableHead className="w-12.5"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const itemTax = item.hasTax ? item.price * TAX_RATE : 0
                      const itemTotal = item.price + itemTax
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={item.price || ''}
                              onChange={(e) =>
                                updateItem(item.id, 'price', parseFloat(e.target.value) || 0)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={item.hasTax}
                                onCheckedChange={(checked) =>
                                  updateItem(item.id, 'hasTax', !!checked)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            ${itemTotal.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {team.members.map((member) => (
                                <button
                                  key={member.clerkId}
                                  type="button"
                                  onClick={() => toggleMemberAssignment(item.id, member.clerkId)}
                                  className="focus:outline-none"
                                  title={`${member.firstName || member.email} — ${
                                    item.assignedTo.includes(member.clerkId)
                                      ? 'click to remove'
                                      : 'click to assign'
                                  }`}
                                >
                                  <Avatar
                                    className={`h-8 w-8 cursor-pointer transition-all ${
                                      item.assignedTo.includes(member.clerkId)
                                        ? 'ring-2 ring-primary'
                                        : 'opacity-40 hover:opacity-70'
                                    }`}
                                  >
                                    <AvatarImage src={member.imageUrl} />
                                    <AvatarFallback className="text-xs">
                                      {member.firstName?.[0] || member.email[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </button>
                              ))}
                              {item.assignedTo.length === 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Split equally
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              disabled={items.length === 1}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Summary + Per-Person Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (13% HST)</span>
                    <span className="tabular-nums">${totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-lg font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">${totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Per-Person Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Per Person
                </CardTitle>
                <CardDescription>
                  Live preview — updates as you assign items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveShares.map((share) => {
                    const member = team.members.find((m) => m.clerkId === share.clerkId)
                    if (!member) return null
                    const percent =
                      totals.grandTotal > 0
                        ? Math.round((share.amount / totals.grandTotal) * 100)
                        : 0
                    return (
                      <div key={share.clerkId} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={member.imageUrl} />
                          <AvatarFallback className="text-xs">
                            {member.firstName?.[0] || member.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">
                              {member.firstName || member.email}
                            </span>
                            <span className="text-sm font-semibold tabular-nums ml-2">
                              ${share.amount.toFixed(2)}
                            </span>
                          </div>
                          {/* Progress bar showing share proportion */}
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {percent}%
                        </span>
                      </div>
                    )
                  })}
                  {totals.grandTotal > 0 && (
                    <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                      Includes tax where applicable
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Link href={`/dashboard/teams/${teamId}/bills/${billId}`} className="flex-1">
              <Button variant="outline" type="button" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Spinner className="mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}