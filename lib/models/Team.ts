import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface ITeamMember {
  userId: Types.ObjectId
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  role: 'owner' | 'member'
  joinedAt: Date
}

export interface ITeam extends Document {
  name: string
  description?: string
  createdBy: Types.ObjectId
  members: ITeamMember[]
  createdAt: Date
  updatedAt: Date
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clerkId: { type: String, required: true },
    email: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    imageUrl: { type: String },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const TeamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [TeamMemberSchema],
  },
  { timestamps: true }
)

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema)

export default Team
