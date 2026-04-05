<div align="center">

# 💸 SplitMoney

**Stop doing math at the dinner table.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square)](https://clerk.com)
[![OpenAI](https://img.shields.io/badge/OCR-GPT--4o--mini-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)

</div>

---

## What is SplitMoney?

**SplitMoney** is a collaborative bill-splitting app built for groups who eat together, shop together, or travel together — and need to figure out who owes what without pulling out a calculator.

Snap a receipt. Items are extracted automatically. Assign them to people. Done.

> You ordered the steak → you pay for the steak.
> Everyone shared the appetizer → everyone splits it equally.
> Tax only on some items? → Handled. Automatically.

---

## Features

### 🧾 Receipt OCR
Upload a photo of any receipt. GPT-4o Vision reads it and populates all items and prices instantly — including detecting which items are HST-taxable (marked with `H` on Canadian receipts).

### 👥 Team Management
Create teams for your recurring groups — roommates, coworkers, travel crew. Add members by email. Two roles: **Owner** (full control) and **Member**.

### ⚡ Smart Bill Splitting
Assign specific items to specific people, or leave items unassigned to split them equally among everyone. 13% HST is calculated per item before splitting, so the math is always exact.

### 📊 Live Per-Person Breakdown
See exactly what each person owes — with a visual progress bar — before you even save the bill. No surprises when you hit submit.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Auth | Clerk |
| Database | MongoDB + Mongoose |
| UI | shadcn/ui + Tailwind CSS |
| OCR | OpenAI GPT-4o-mini Vision |
| Data Fetching | SWR |
| Notifications | Sonner |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (free tier works)
- A Clerk account (free tier works)
- An OpenAI API key

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/splitmoney.git
cd splitmoney
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root and add the following:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/splitmoney
OPENAI_API_KEY=sk-...
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How It Works

### The Bill Lifecycle

1. **Create a team** and invite members by email
2. **Add a bill** — either enter items manually or upload a receipt photo
3. **OCR extracts items** automatically from the receipt image
4. **Assign items** to specific members by clicking their avatars, or leave unassigned to split equally
5. **Live preview** shows each person's exact share (including tax) before saving
6. **Save** — SplitMoney stores the full breakdown per person in the database

### Tax Calculation

Tax is applied **per item, before splitting**. So if two people share a $20 taxable item, each pays their share of $22.60 — not $10 plus tax calculated separately. This mirrors how real receipts work.

Items marked with `H` on Canadian receipts are automatically flagged as HST-taxable (13%) by the OCR.

---

## API Reference

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams` | Get all teams for current user |
| `POST` | `/api/teams` | Create a new team |
| `GET` | `/api/teams/:teamId` | Get team details |
| `PUT` | `/api/teams/:teamId` | Update team name/description |
| `DELETE` | `/api/teams/:teamId` | Delete team + all bills (owner only) |

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/teams/:teamId/members` | Add a member by Clerk ID |
| `DELETE` | `/api/teams/:teamId/members?memberClerkId=` | Remove a member or leave a team |

### Bills

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/teams/:teamId/bills` | Get all bills for a team |
| `POST` | `/api/teams/:teamId/bills` | Create a bill (auto-calculates splits) |
| `GET` | `/api/teams/:teamId/bills/:billId` | Get bill detail |
| `PUT` | `/api/teams/:teamId/bills/:billId` | Update bill (recalculates splits) |
| `DELETE` | `/api/teams/:teamId/bills/:billId` | Delete a bill |

### OCR

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ocr` | Send a base64 receipt image, receive extracted items |

---

## Deployment

### Vercel (Recommended)

Connect your GitHub repo to [Vercel](https://vercel.com) and add all environment variables from `.env.local` in the project settings. Deploys automatically on every push to `main`.

### Self-Hosted

Build and start the production server with `npm run build` followed by `npm start`.

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Push and open a Pull Request

All contributions welcome — bug fixes, new features, UI improvements.

---

## License

MIT — do whatever you want with it.

---

<div align="center">

Built because splitting bills manually is a pain.

**[⭐ Star this repo](https://github.com/yourusername/splitmoney)** if it saved you an argument at dinner.

</div>
