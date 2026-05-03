# MailGard 🛡️

**MailGard** is a production-ready email deliverability intelligence and controlled SMTP warm-up system designed for cPanel-hosted email accounts. It prioritizes deliverability safety, DNS reputation, and AI-assisted risk management.

## 🚀 Key Features

- **Deliverability Diagnostics**: Automated SPF, DKIM, and DMARC validation.
- **IP Reputation Monitoring**: Integration with AbuseIPDB and blacklist checks.
- **AI Risk Engine**: Gemini-powered health scoring and recommendation engine.
- **Controlled Warm-up**: Gradual, randomized ramp-up to build sender trust safely.
- **Job Queue Architecture**: Reliable background processing via BullMQ and Redis.
- **Safety Throttling**: Automatic pausing on high bounce rates or SMTP failures.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Lucide React, Recharts.
- **Backend**: Node.js, Express, TypeScript.
- **Database**: PostgreSQL (Prisma 7).
- **Queueing**: BullMQ + Redis.
- **AI**: Google Gemini 1.5 Flash.
- **SMTP**: Nodemailer.

## 📦 Project Structure

- `/backend`: Express API, Prisma models, background workers, and core logic.
- `/frontend`: Next.js dashboard UI.

## ⚙️ Setup

### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` (see `.env.example`)
4. `npx prisma generate`
5. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 🛡️ Safety Philosophy
MailGard is NOT a spam tool. It is built to protect domain reputation by enforcing strict limits and using AI to detect anomalies before they result in blacklisting.