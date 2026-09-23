# Krishisetu

A modern agricultural bridge platform built with **Next.js 16 (App Router)**, **TailwindCSS**, and **Supabase**.

## 🌾 Supabase Connection
- **Project Ref**: `htgxpflareheltfewlif`
- **Region**: `ap-northeast-2`
- **Project URL**: `https://htgxpflareheltfewlif.supabase.co`
- **Status**: Active & Healthy

## 🚀 Getting Started

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

### 2. Build for Production
```bash
npm run build
npm run start
```

## 📁 Project Structure
- [`src/lib/supabase/client.ts`](file:///c:/Users/EDIT/NEWSETU/src/lib/supabase/client.ts): Client-side Supabase helper (`createBrowserClient`)
- [`src/lib/supabase/server.ts`](file:///c:/Users/EDIT/NEWSETU/src/lib/supabase/server.ts): Server-side Supabase helper (`createServerClient`)
- [`src/lib/supabase/middleware.ts`](file:///c:/Users/EDIT/NEWSETU/src/lib/supabase/middleware.ts): Session refresh utility
- [`src/middleware.ts`](file:///c:/Users/EDIT/NEWSETU/src/middleware.ts): Next.js auth session middleware
- [`src/app/page.tsx`](file:///c:/Users/EDIT/NEWSETU/src/app/page.tsx): Landing and live Supabase status dashboard
- [`.env.local`](file:///c:/Users/EDIT/NEWSETU/.env.local): Local environment variables (git-ignored)
- [`.env.example`](file:///c:/Users/EDIT/NEWSETU/.env.example): Environment variable template
