# GMS - Gym Management System Setup Guide

This guide covers everything you need to set up and run the Gym Management System from scratch on a new computer.

## Prerequisites
Before you begin, ensure you have the following installed on the new computer:
1. **Node.js** (v20 or v24 recommended)
2. **pnpm** (Install via `npm install -g pnpm`)
3. **PostgreSQL** (Running on default port `5432`)
4. **Redis** (Running on default port `6379`)

## 1. Clone the Repository
Clone the repository and open the terminal in the root folder:
```powershell
git clone <your-repo-url>
cd GMS-Gym-Management-System
```

## 2. Install Dependencies
Install all project dependencies using pnpm. This will also automatically apply the necessary patches (like the `zkteco-js` crash fix) under the hood.
```powershell
pnpm install
```

## 3. Environment Variables
You need to set up the environment variables for the API and Web apps.

1. Go to `apps/api` and create a `.env` file (you can copy from `.env.example` if it exists).
2. Set the `DATABASE_URL` to point to your local PostgreSQL instance:
```env
# apps/api/.env
DATABASE_URL="postgresql://postgres:password@localhost:5432/gms?schema=public"
```
*(Replace `postgres` and `password` with your actual local database credentials).*

## 4. Database Setup & Prisma
Since the `node_modules` are fresh, you must generate the Prisma client types and push the schema to the database. 

Run these commands inside the `apps/api` directory:
```powershell
cd apps/api

# 1. Generate the Prisma TypeScript client
npx prisma generate

# 2. Push the schema to your Postgres database (creates tables)
npx prisma db push

# 3. Seed the database with the default Admin user
npx ts-node prisma/seed.ts

cd ../..
```
*Note: The default admin login is `admin@gms.local` with password `Admin@123`.*

## 5. Build Internal Packages
Because this is a Turborepo, the internal workspace packages (like `@gms/utils`) need to be compiled at least once before the development server can find their files.

From the **root directory** of the project, run:
```powershell
pnpm --filter @gms/utils build
```

## 6. Start the App!
Finally, you can start up both the Next.js Frontend and NestJS Backend simultaneously:
```powershell
pnpm run dev
```

The Web app will be available at `http://localhost:3000` and the API will be running on its configured port. You can now log in using `admin@gms.local`!
