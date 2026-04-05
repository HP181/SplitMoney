  'use client'

  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { ArrowLeft, Users } from 'lucide-react'
  import Link from 'next/link'
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Textarea } from '@/components/ui/textarea'
  import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
  import { toast } from 'sonner'
  import { Spinner } from '@/components/ui/spinner'

  export default function NewTeamPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!name.trim()) {
        toast.error('Team name is required')
        return
      }

      setLoading(true)
      try {
        const res = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create team')
        }

        const data = await res.json()
        toast.success('Team created successfully')
        router.push(`/dashboard/teams/${data.team._id}`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create team')
      } finally {
        setLoading(false)
      }
    }

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/teams">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create Team</h1>
            <p className="mt-1 text-muted-foreground">Set up a new team for expense splitting</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Details
            </CardTitle>
            <CardDescription>
              Enter the details for your new team. You can add members after creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Team Name</FieldLabel>
                  <Input
                    id="name"
                    placeholder="Enter team name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="description">Description (optional)</FieldLabel>
                  <Textarea
                    id="description"
                    placeholder="Enter team description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </Field>
              </FieldGroup>
              <div className="mt-6 flex gap-3">
                <Link href="/dashboard/teams" className="flex-1">
                  <Button variant="outline" type="button" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Spinner className="mr-2" />}
                  Create Team
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }
