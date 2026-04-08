import nodemailer from 'nodemailer'
import { generateBillEmailHtml } from './emailTemplates'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface MemberShare {
  email: string
  firstName?: string
  lastName?: string
  amount: number
}

interface BillEmailPayload {
  type: 'created' | 'updated'
  teamName: string
  billName: string
  billId: string
  teamId: string
  grandTotal: number
  memberShares: MemberShare[]
}

export async function sendBillEmails(payload: BillEmailPayload): Promise<void> {
  const { type, teamName, billName, memberShares, grandTotal, billId, teamId } = payload

  const billUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/teams/${teamId}/bills/${billId}`

  const emailPromises = memberShares.map((member) => {
    const html = generateBillEmailHtml({
      type,
      teamName,
      billName,
      grandTotal,
      memberAmount: member.amount,
      memberName: member.firstName || member.email.split('@')[0],
      billUrl,
    })

    return transporter.sendMail({
      from: `"SplitMoney" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: member.email,
      subject:
        type === 'created'
          ? `💸 New bill in ${teamName}: ${billName}`
          : `✏️ Bill updated in ${teamName}: ${billName}`,
      html,
    })
  })

  // Send all emails concurrently, log errors but don't throw
  const results = await Promise.allSettled(emailPromises)
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`Failed to send email to ${memberShares[i].email}:`, result.reason)
    }
  })
}