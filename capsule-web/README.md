# 🌐 Capsule Web Dashboard

> The professional command center for your Video Library. Built with precision, performance, and a stunning glassmorphic design system.

---

## ✨ Features

### 📂 Pro Folder Management
- **Infinite Nesting**: Organize your content with recursive folder structures.
- **Full Lifecycle**: Create, Rename, and Delete folders directly from the dashboard.
- **Drill-down Navigation**: Interactive folder browser with real-time breadcrumbs.
- **Smart Thumbnails**: Real-time folder stats (video counts) and visual feedback.

### 📱 Premium Mobile Experience
- **High-Density Layout**: Optimized video and folder cards inspired by YouTube's mobile density.
- **Glass-Panel-Heavy**: A custom-built mobile navigation drawer with enhanced blur and opacity for maximum readability.
- **Responsive Grids**: Dynamic multi-column layouts that adapt perfectly to any screen size.

### 🎨 Design & Aesthetic
- **Glassmorphism**: A curated design system using subtle blurs, borders, and vibrant accents.
- **Dual View Modes**: Switch between a structured **Tree View** or a visual **Tile Grid**.
- **Dark Mode Native**: Deep obsidian backgrounds with ergonomic readability.

---

## 🛠️ Technical Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Styling**: Vanilla CSS + Tailwind for utility tokens.
- **Auth**: [Clerk](https://clerk.com/) (Secure, modern authentication)
- **Database**: [Prisma](https://www.prisma.io/) + PostgreSQL/SQLite.
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: Custom CSS keyframes and transitions.

---

## 🚦 Getting Started

### 1. Environment Setup
Create a `.env` file in the root:

```env
DATABASE_URL="your-database-url"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-key"
CLERK_SECRET_KEY="your-clerk-secret"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

### 2. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard.

---

## 📂 Key Architecture
- `src/app/api/`: REST endpoints for folder/video lifecycle management.
- `src/app/dashboard/`: Core dashboard logic and UI components.
- `src/lib/treeHelpers.ts`: Recursive algorithms for building the folder tree.
- `src/app/globals.css`: The "Capsule" glassmorphism design system.
