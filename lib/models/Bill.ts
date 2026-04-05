import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IBillItem {
  name: string
  price: number
  hasTax: boolean
  taxAmount: number
  totalPrice: number
  assignedTo: string[] // clerkIds of members
}

export interface IMemberShare {
  clerkId: string
  email: string
  firstName?: string
  lastName?: string
  amount: number
}

export interface IBill extends Document {
  teamId: Types.ObjectId
  name: string
  description?: string
  receiptUrl?: string
  items: IBillItem[]
  subtotal: number
  totalTax: number
  grandTotal: number
  memberShares: IMemberShare[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const BillItemSchema = new Schema<IBillItem>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    hasTax: { type: Boolean, default: false },
    taxAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    assignedTo: [{ type: String }],
  },
  { _id: true }
)

const MemberShareSchema = new Schema<IMemberShare>(
  {
    clerkId: { type: String, required: true },
    email: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    amount: { type: Number, required: true },
  },
  { _id: false }
)

const BillSchema = new Schema<IBill>(
  {
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    name: { type: String, required: true },
    description: { type: String },
    receiptUrl: { type: String },
    items: [BillItemSchema],
    subtotal: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    memberShares: [MemberShareSchema],
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
)

const Bill: Model<IBill> = mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema)

export default Bill
